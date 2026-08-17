# infra/

**Propósito:** infraestructura de despliegue — todo lo que orquesta cómo corre el proyecto, no lo que el proyecto hace.

## Contenido

| Carpeta       | Qué contiene                                                                                              | README propio                |
| ------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `docker/`     | `docker-compose.yml` (base) + `.dev.yml`/`.prod.yml` (overlays), Dockerfiles referenciados desde `apps/*` | [README](docker/README.md)   |
| `nginx/`      | `nginx.conf` — único punto de entrada, reutilizado como reglas de Ingress en K8s                          | —                            |
| `kubernetes/` | `base/` + `overlays/staging/production` (Kustomize) — staging y production reales                         | —                            |
| `redis/`      | Tuning de Redis (`redis.conf`)                                                                            | —                            |
| `postgres/`   | Tuning de Postgres (`postgresql.conf`) — nunca el schema, eso es `docs/database/sql/`                     | —                            |
| `rabbitmq/`   | Convención de exchanges/colas (sin definiciones estáticas — cada módulo declara la suya)                  | [README](rabbitmq/README.md) |
| `minio/`      | Convención de buckets (sin buckets fabricados — un bucket por módulo, se crean cuando el módulo existe)   | [README](minio/README.md)    |
| `mailhog/`    | Captura de correo, solo dev                                                                               | [README](mailhog/README.md)  |
| `scripts/`    | Seed, backup/restore ejecutable, migraciones batch                                                        | [README](scripts/README.md)  |

## Reglas

- **Nada acá tiene lógica de negocio ni sabe de módulos específicos** — es la misma regla que separa `apps/` de `modules/`, aplicada a infraestructura.
- `docker-compose.dev.yml` expone puertos de administración (pgAdmin, RabbitMQ UI, MinIO console) que `docker-compose.prod.yml` nunca expone.
- La topología es intencionalmente la misma forma en `local`/`staging`/`production` — solo cambian réplicas/recursos/namespace, nunca la estructura.

Detalle completo: [docs/architecture/08-infraestructura-y-despliegue.md](../docs/architecture/08-infraestructura-y-despliegue.md) y [31-infraestructura-completa.md](../docs/architecture/31-infraestructura-completa.md).
