# Backend Infrastructure Report — GORAZUS ERP

> Fase 2, Parte 1 — Infraestructura Backend Enterprise. Sesión del
> 2026-07-21, rama `gorazus2`. Este documento sintetiza los otros 4
> entregables de esta sesión — [DEPENDENCY_REPORT.md](./DEPENDENCY_REPORT.md),
> [DOCKER_REPORT.md](./DOCKER_REPORT.md), [CI_REPORT.md](./CI_REPORT.md),
> [HEALTHCHECK_REPORT.md](./HEALTHCHECK_REPORT.md) — sin repetir su detalle.
> `PROJECT_STRUCTURE.md` (también pedido como entregable) ya existía y se
> revisó como parte de esta sesión: refleja el estado real del árbol de
> carpetas, sin cambios necesarios.

## 1. Punto de partida — dos discrepancias con el pedido original

1. **Stack**: el pedido lista estándares PHP (PSR-12, PHPStan, PHP CS
   Fixer, PHPUnit). Este repo es Node.js/TypeScript (NestJS + Nx) — sin
   PHP en ningún lado. Tratado como pedido de los equivalentes reales
   (ESLint/Prettier/tsc strict/Jest/Swagger), confirmado con el usuario
   antes de empezar.
2. **Alcance ya cubierto**: `PROJECT_STATUS.md`/`VERSION.md` documentan que
   la mayoría de esta infraestructura (Docker, Foundation Platform,
   persistencia, CI) ya se construyó y verificó en versiones `0.1.0`/`0.2.0`
   previas. Esta sesión fue una **auditoría + corrección de gaps reales**,
   no una reconstrucción — confirmado con el usuario antes de empezar.

## 2. Metodología

Un agente de auditoría de solo-lectura revisó el checklist completo del
pedido original (estructura, config, Docker, Postgres/Redis/MinIO/logging,
i18n, calidad de código, CI/CD, docs, secretos) contra el estado real del
repo. Cada hallazgo se clasificó en tres categorías:

- **Ya cubierto** — no se tocó, solo se confirmó.
- **Gap real de infraestructura** — corregido esta sesión.
- **Cruza a lógica de negocio o requiere alcance propio** — documentado,
  explícitamente no construido (el pedido original prohíbe empezar módulos
  funcionales).

## 3. Cambios de esta sesión (7 commits, `git log` en `gorazus2`)

| #   | Commit                                                                    | Categoría                      |
| --- | ------------------------------------------------------------------------- | ------------------------------ |
| 1   | `build(docker): add healthcheck to api service`                           | Docker                         |
| 2   | `build(testing): add coverage threshold and test:cov script`              | Calidad de código              |
| 3   | `feat(cache): add Redis-backed distributed lock utility`                  | Redis                          |
| 4   | `fix(database): bound connection_limit on all 21 Prisma clients`          | PostgreSQL                     |
| 5   | `docs(config): document why Docker-only secrets are out of env.schema.ts` | Config                         |
| 6   | `fix(ci): point workflows at gorazus2, the repo's real default branch`    | CI/CD (**hallazgo principal**) |
| 7   | _(este commit)_ `docs(core): infrastructure audit deliverables`           | Documentación                  |

El hallazgo de más impacto es el #6: los 3 workflows con trigger por rama
apuntaban a un branch (`main`) que no existe en este repo — el pipeline de
CI/CD nunca se había disparado para trabajo real. Detalle completo en
[CI_REPORT.md](./CI_REPORT.md) §1.

## 4. Ya cubierto — confirmado sin cambios

- Estructura Clean Architecture/DDD (`Application`/`Domain`/`Infrastructure`/
  etc. mapeados a `core/`, `modules/*/backend`, `apps/`, `packages/`) —
  reforzada por `@nx/enforce-module-boundaries`, no solo convención.
- Los 3 compose de Docker (base/dev/prod), con healthchecks en toda la
  infraestructura de terceros.
- PostgreSQL: 21 clientes Prisma, migraciones vía SQL versionado, RLS.
- Redis: cache (`core/cache`) y rate limiting (`core/http`, `ThrottlerGuard`
  global).
- Logging de aplicación con correlación de requests (`core/logging`).
- OpenAPI/Swagger auto-generado al boot (`core/kernel/bootstrap.ts`), no
  una colección mantenida a mano.
- Husky + commitlint (Conventional Commits) + Prettier ya wireados.
- Secretos: `.env` gitignored y confirmado no trackeado; `.env.example`
  sin valores reales.

## 5. Corregido esta sesión (gaps reales de infraestructura)

| Gap                                                                      | Fix                                                                                                           |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `api` sin healthcheck — `nginx` no podía saber si ya estaba listo        | `HEALTHCHECK` + `depends_on: condition: service_healthy` (§ [HEALTHCHECK_REPORT.md](./HEALTHCHECK_REPORT.md)) |
| Cobertura de tests medida pero no gateada                                | `coverageThreshold` + `collectCoverageFrom` + `test:cov`                                                      |
| Sin utilidad de lock distribuido (Redis)                                 | `LockService` en `core/cache`, probado contra Redis real                                                      |
| 21 clientes Prisma sin límite de pool — riesgo real de agotar conexiones | `connection_limit=4` por cliente (§ [DEPENDENCY_REPORT.md](./DEPENDENCY_REPORT.md) §5)                        |
| CI apuntando a una rama inexistente — nunca corrió                       | 4 referencias `main` → `gorazus2` (§ [CI_REPORT.md](./CI_REPORT.md) §1)                                       |
| Sin validación de build de imagen Docker antes de merge                  | Job `docker-build` nuevo en `pr-validation.yml`                                                               |

## 6. Cruza a lógica de negocio — documentado, no construido

El pedido original es explícito: _"No comenzar módulos funcionales. No
desarrollar lógica de negocio."_ Estos hallazgos del audit son reales, pero
construirlos requeriría tocar un módulo de negocio o inventar un consumidor
artificial — se documentan como gap conocido, no se fuerza código:

- **`core/storage` (MinIO) sin consumidor real** — el servicio existe
  completo (upload/getSignedUrl/delete), ningún módulo lo importa todavía.
  Se activa cuando el primer módulo con adjuntos/documentos reales
  (`documentos`, o cualquier otro con archivos) lo necesite.
- **`core/messaging` (RabbitMQ) sin consumidor real** — mismo caso;
  `EventBusService` existe, cero referencias en `modules/*`. El servicio
  `worker` del compose está comentado a propósito, documentado en el mismo
  archivo, a la espera de `core/jobs/job-worker.ts`.
- **`core/scheduler` sin ningún cron real registrado** — mismo patrón.
- **Timezone/idioma/locale como config de infraestructura** — evaluado y
  descartado a propósito: `core.timezones`/`core.languages` ya están
  modelados como catálogos dinámicos por-empresa en el módulo `configuracion`
  (`docs/database/logico/21-configuration.md`), no como variable de entorno
  estática. Construir un `core/config` paralelo basado en env vars
  duplicaría/contradiría ese diseño ya tomado — pertenece a `configuracion`,
  no a esta fase de infraestructura.
- **Promoción de `AuditoriaService` (`modules/seguridad`) a concern
  transversal de `core/*`** — señalado por el audit como posible mejora
  (hoy cualquier módulo que quiera auditoría debe depender de `seguridad`
  explícitamente), pero es una decisión de arquitectura sobre un módulo de
  negocio ya construido y probado — no se tocó.

## 7. Evaluado y revertido (no shippeado, ver detalle en su reporte)

- **ESLint type-aware/strict** (`recommendedTypeChecked`) — probado, causó
  `heap out of memory` al correr sobre el monorepo completo en este
  entorno, incluso secuencialmente. Revertido a la config original en vez
  de mergear algo no verificado. Detalle: [CI_REPORT.md](./CI_REPORT.md) §4.2.

## 8. Validaciones finales

| Validación                                                       | Resultado                                                                                                                     |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `nx build api` (grafo completo, 17 tareas dependientes)          | ✅ compila                                                                                                                    |
| `nx lint` (paquetes tocados)                                     | ✅ sin errores                                                                                                                |
| `docker compose config` (dev y prod)                             | ✅ sin errores                                                                                                                |
| `docker build` (api y web, producción)                           | ✅ ambas imágenes compilan                                                                                                    |
| Tests contra infraestructura real (`auth-backend`, `core-cache`) | ✅ pasan (aislados — correrlos todos juntos satura la memoria de este sandbox, no relacionado con los cambios de esta sesión) |
| PHPStan / PHP CS Fixer                                           | N/D — no es PHP, ver §1                                                                                                       |
| MinIO conecta (contenedor)                                       | ✅ `mc ready local` healthcheck pasa (`docker ps`, sesión completa)                                                           |
| MinIO conecta (`core/storage` como cliente)                      | No verificado — sin consumidor real que lo ejercite, ver §6                                                                   |
