# Docker Report — GORAZUS ERP

> Estado de la infraestructura Docker a 2026-07-21. Generado como entregable
> de la sesión "Fase 2, Parte 1 — Infraestructura Backend Enterprise" (rama
> `gorazus2`). El detalle de decisiones de arquitectura ya vive en
> [docs/architecture/08-infraestructura-y-despliegue.md](./docs/architecture/08-infraestructura-y-despliegue.md)
> — este documento es un inventario del estado real verificado, no lo
> reemplaza.

## 1. Archivos (`infra/docker/`)

| Archivo                         | Propósito                                                                                       |
| ------------------------------- | ----------------------------------------------------------------------------------------------- |
| `docker-compose.yml`            | Topología base — todos los servicios, healthchecks, networks, volumes                           |
| `docker-compose.dev.yml`        | Overlay: hot-reload de api/web, puertos de admin (pgAdmin, RabbitMQ UI, MinIO console, MailHog) |
| `docker-compose.prod.yml`       | Overlay: sin hot-reload, sin puertos de admin, `restart: unless-stopped`, `api` con 2 réplicas  |
| `docker-compose.monitoring.yml` | Prometheus/Grafana/Loki (observabilidad, opcional)                                              |
| `apps/api/Dockerfile`           | Multi-stage: `base` → `development`/`build`/`production`                                        |
| `apps/web/Dockerfile`           | Multi-stage: build estático, sin servidor Node en producción (nginx sirve los assets)           |

Los tres compose de topología (base/dev/prod) existían ya — la sesión no
tuvo que crearlos, solo agregar el healthcheck de `api` (ver
[HEALTHCHECK_REPORT.md](./HEALTHCHECK_REPORT.md)).

## 2. Servicios

| Servicio   | Imagen                                                     | Rol                                                                           |
| ---------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `api`      | build propio (`apps/api/Dockerfile`)                       | Backend NestJS                                                                |
| `web`      | build propio (`apps/web/Dockerfile`)                       | Init container — copia el build estático a `web_dist`, lo sirve `nginx`       |
| `nginx`    | `nginx:1.27-alpine`                                        | Reverse proxy — único punto de entrada externo (80/443)                       |
| `postgres` | build propio (`infra/postgres/`, base PG17 + `pg_partman`) | Base de datos                                                                 |
| `backup`   | misma imagen que `postgres`                                | `pg_dump` inmediato al arrancar + diario, retención 7 días                    |
| `redis`    | `redis:7-alpine`                                           | Cache + rate limiting (`core/http`) + locks (`core/cache`, nuevo esta sesión) |
| `rabbitmq` | `rabbitmq:3.13-management-alpine`                          | Broker de eventos (`core/messaging`) — sin consumidor real todavía            |
| `minio`    | `minio/minio:latest`                                       | Almacenamiento S3-compatible (`core/storage`) — sin consumidor real todavía   |
| `ollama`   | `ollama/ollama:latest`                                     | Infraestructura de IA, sin asistente de negocio todavía                       |
| `pgadmin`  | `dpage/pgadmin4:8` (solo dev)                              | Administración de Postgres                                                    |
| `mailhog`  | `mailhog/mailhog:v1.0.1` (solo dev)                        | Captura de correo saliente, no lo envía de verdad                             |

`worker` (background jobs) existe como bloque comentado en
`docker-compose.yml` — reusa la imagen de `api` con un `command` placeholder,
a la espera de que exista `core/jobs/job-worker.ts`. Documentado
explícitamente en el propio archivo como decisión pendiente, no como
omisión.

## 3. Verificación hecha esta sesión

- `docker compose -f docker-compose.yml -f docker-compose.dev.yml config --quiet` → sin errores.
- `docker compose -f docker-compose.yml -f docker-compose.prod.yml config --quiet` → sin errores.
- `docker build -f apps/api/Dockerfile --target production` → build exitoso.
- `docker build -f apps/web/Dockerfile --target production` → build exitoso (bundle de 558 kB en el chunk principal, advertencia de Vite sobre code-splitting — no bloqueante, no corregido esta sesión por ser optimización de frontend, fuera de alcance).
- Stack real corriendo (`docker ps`) durante toda la sesión: postgres/redis/rabbitmq/minio/nginx/pgadmin/mailhog/backup/api, todos `healthy` salvo `api` (sin healthcheck hasta este cambio) y `backup` (sin healthcheck por diseño, es un cronjob de un solo comando).

## 4. Cambios de esta sesión

Ver [HEALTHCHECK_REPORT.md](./HEALTHCHECK_REPORT.md) §2 para el detalle del
`HEALTHCHECK` agregado a `api`. Ningún otro archivo de este directorio se
modificó.

## 5. No tocado, evaluado y descartado

- **`connection_limit` de Postgres a nivel de contenedor**
  (`infra/postgres/postgresql.conf`, `max_connections = 100`): el propio
  archivo ya documenta que el sizing real de producción es decisión de ops
  contra el operator de Postgres en K8s, no un valor fijo de dev — no se
  toca. Lo que sí se corrigió es el lado de la aplicación (21 clientes
  Prisma sin `connection_limit` propio, ver
  [DEPENDENCY_REPORT.md](./DEPENDENCY_REPORT.md) §3).
