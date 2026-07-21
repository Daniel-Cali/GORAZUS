# core/

**Propósito:** infraestructura técnica transversal — todo lo que cualquier módulo de negocio necesita y que **no es negocio en sí mismo**.

**Responsabilidad:** proveer servicios de plataforma (config, logging, HTTP, salud, observabilidad, cache, storage, mensajería, scheduler, persistencia) como paquetes pnpm/Nx reales, cada uno inyectable vía NestJS DI.

## Contenido

| Paquete          | Nombre pnpm                   | Qué provee                                                                                                                                                                                                                                                                           |
| ---------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `config/`        | `@gorazus/core-config`        | `ConfigModule`, validación Zod fail-fast, namespaces tipados (database/redis/rabbitmq/storage/auth)                                                                                                                                                                                  |
| `logging/`       | `@gorazus/core-logging`       | `LoggerService` (JSON estructurado), `RequestContext` (correlación vía AsyncLocalStorage)                                                                                                                                                                                            |
| `http/`          | `@gorazus/core-http`          | Exception filter, interceptors, middlewares, pipes, rate limiting — globales                                                                                                                                                                                                         |
| `health/`        | `@gorazus/core-health`        | `/health/live`, `/health/ready` — registro desacoplado de indicadores                                                                                                                                                                                                                |
| `kernel/`        | `@gorazus/core-kernel`        | `bootstrap()` — único punto de arranque (Swagger, Helmet, CORS, compression)                                                                                                                                                                                                         |
| `observability/` | `@gorazus/core-observability` | Tracing (OpenTelemetry) + Metrics (Prometheus)                                                                                                                                                                                                                                       |
| `cache/`         | `@gorazus/core-cache`         | `CacheService` (Redis, namespace `cache:*`)                                                                                                                                                                                                                                          |
| `storage/`       | `@gorazus/core-storage`       | `StorageService` (MinIO, URLs firmadas)                                                                                                                                                                                                                                              |
| `messaging/`     | `@gorazus/core-messaging`     | `EventBusService` (RabbitMQ, exchange `gorazus.eventos`)                                                                                                                                                                                                                             |
| `scheduler/`     | `@gorazus/core-scheduler`     | `SchedulerService` (cron jobs)                                                                                                                                                                                                                                                       |
| `database/`      | `@gorazus/core-database`      | 21 clientes Prisma, uno por schema de Postgres — ver su propio README/comentarios en `database.module.ts`                                                                                                                                                                            |
| `realtime/`      | _(sin package.json todavía)_  | WebSocket Gateway base + adaptador Redis — escafoldado, sin construir. Se implementa cuando el primer módulo necesite tiempo real (ver [docs/architecture/05-flujo-de-datos.md §2](../docs/architecture/05-flujo-de-datos.md#2-ciclo-de-vida-de-un-evento-en-tiempo-real-websocket)) |

## Reglas

- **Un `core/*` puede depender de otro `core/*`** (p. ej. `core-http` depende de `core-logging` y `core-observability`) — es la única excepción a "un módulo no importa a otro módulo", porque esto es infraestructura en capas, no negocio horizontal. Ver `eslint.config.mjs`, constraint `type:core`.
- **`core/*` nunca importa de `modules/*`.** Core no conoce negocio, nunca al revés.
- Cada paquete es `@Global()` en NestJS — se importa una vez en `AppModule` y queda disponible en toda la app sin reimportar.
- Todo paquete nuevo acá sigue el mismo scaffold: `package.json` (nombre `@gorazus/core-<x>`), `project.json` (targets build/lint/test), `tsconfig.json`, `jest.config.ts`, `index.ts` (barrel).

Detalle de diseño de cada componente: [docs/architecture/32-core-platform/](../docs/architecture/32-core-platform/).
