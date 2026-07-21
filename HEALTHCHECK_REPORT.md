# Healthcheck Report — GORAZUS ERP

> Estado de los healthchecks de infraestructura a 2026-07-21. Generado como
> entregable de la sesión "Fase 2, Parte 1 — Infraestructura Backend
> Enterprise" (rama `gorazus2`). Complementa a
> [DOCKER_REPORT.md](./DOCKER_REPORT.md) (topología completa) sin duplicarlo.

## 1. Endpoints de la aplicación

| Endpoint            | Verifica                                                                       | Uso                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `GET /health/live`  | Solo que el proceso responde — sin tocar dependencias                          | Docker `HEALTHCHECK` (nuevo, esta sesión) y liveness probe de K8s (`infra/kubernetes/base/api-deployment.yaml`) |
| `GET /health/ready` | Agrega los indicadores registrados (Postgres/Redis/RabbitMQ vía `core/health`) | Readiness probe de K8s — deja de enrutar tráfico a la réplica sin reiniciarla                                   |

Ambos son `@Public()` (sin JWT) — bug real corregido en FASE 05, documentado
en `core/health/health.controller.ts`: el kubelet no tiene ni puede tener un
JWT, y sin esa anotación el guard global devolvía 401 a los probes.

`/health/live` es la que debe usarse para cualquier healthcheck de
"¿el proceso sigue vivo?" (Docker `HEALTHCHECK`, liveness probe) — nunca
`/health/ready`, para no reiniciar un contenedor sano solo porque una
dependencia externa está momentáneamente caída.

## 2. Healthchecks por servicio (`infra/docker/docker-compose.yml`)

| Servicio   | Healthcheck                                                    | Estado                  |
| ---------- | -------------------------------------------------------------- | ----------------------- |
| `postgres` | `pg_isready`                                                   | Ya existía              |
| `redis`    | `redis-cli ping`                                               | Ya existía              |
| `rabbitmq` | `rabbitmq-diagnostics -q ping`                                 | Ya existía              |
| `minio`    | `mc ready local`                                               | Ya existía              |
| `ollama`   | `curl -f http://localhost:11434`                               | Ya existía              |
| `nginx`    | `wget --spider http://localhost/nginx-health`                  | Ya existía              |
| `api`      | `wget --spider http://localhost:3000/health/live`              | **Nuevo — esta sesión** |
| `web`      | — (init container: copia su build y termina, nunca queda vivo) | No aplica, por diseño   |

Antes de esta sesión, `api` era el único servicio propio del compose sin
healthcheck — `nginx` dependía de él con `condition: service_started`, que
solo confirma que el proceso arrancó, no que ya puede atender tráfico
(Postgres/Redis/RabbitMQ/MinIO podían seguir conectando). Con las 21
conexiones Prisma + Redis + RabbitMQ que `api` abre al bootear, hay una
ventana real donde el proceso está arriba pero no listo.

**Cambio**: `HEALTHCHECK` agregado a `apps/api/Dockerfile` (etapas
`development` y `production`) + bloque `healthcheck:` explícito en
`docker-compose.yml`, y `nginx`'s `depends_on.api.condition` pasado a
`service_healthy` en `docker-compose.yml` y `docker-compose.dev.yml`.
Verificado con `docker compose config --quiet` en ambos overlays (dev y
prod) sin errores.

## 3. Kubernetes (referencia, no tocado esta sesión)

`infra/kubernetes/base/api-deployment.yaml` y `web-deployment.yaml` ya
tenían `readinessProbe`/`livenessProbe` propios, independientes del
`HEALTHCHECK` de Docker (K8s no lo usa) — confirmado presente antes de esta
sesión, sin cambios necesarios acá.

## 4. Pendiente, fuera de alcance de esta sesión

- **Conexiones de base de datos**: los 21 clientes Prisma ahora tienen
  `connection_limit` acotado (ver [DEPENDENCY_REPORT.md](./DEPENDENCY_REPORT.md)
  §3), pero `/health/ready` valida conectividad, no agotamiento del pool —
  un pool saturado no lo reportaría un readiness check simple. Instrumentar
  eso (métricas de pool vía Prometheus, `core/observability`) es trabajo de
  observabilidad, no de esta fase.
- **RabbitMQ/Scheduler**: sin consumidor real todavía (ver
  [BACKEND_INFRASTRUCTURE_REPORT.md](./BACKEND_INFRASTRUCTURE_REPORT.md) §5)
  — no hay healthcheck de "¿el worker está consumiendo?" porque no existe
  worker real todavía.
