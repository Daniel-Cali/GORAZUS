# CI Report — GORAZUS ERP

> Estado de CI/CD a 2026-07-21. Generado como entregable de la sesión
> "Fase 2, Parte 1 — Infraestructura Backend Enterprise" (rama `gorazus2`).

## 1. Hallazgo principal de esta sesión: el pipeline nunca había corrido

Los 3 workflows con trigger por rama (`pr-validation.yml`, `security.yml`,
`deploy-staging.yml`) y `nx.json`'s `defaultBase` apuntaban todos a `main`.
**Ese branch no existe en este repo** — confirmado con
`git ls-remote --symref origin HEAD` (resuelve a `refs/heads/gorazus2`) y
`git branch -a` (local: `gorazus2`, `master`, `release/database-v1`,
`feature/database-audit`; remoto: solo `gorazus2`). Como los triggers
`pull_request`/`push` están acotados por nombre de rama, ninguno de estos
tres workflows se había disparado nunca para trabajo real sobre este
proyecto — el pipeline existía en disco, pero no estaba gateando nada.
`nx affected` (usado también por `pnpm test:affected`/`lint:affected`/
`build:affected` en local) tenía el mismo problema: diffaba contra una base
que nunca resuelve.

**Corregido esta sesión**: las 4 referencias a `main` cambiadas a
`gorazus2` en los 3 workflows + `nx.json`. Ver commit
`fix(ci): point workflows at gorazus2, the repo's real default branch`.

## 2. Los 5 workflows (`.github/workflows/`)

| Workflow                   | Trigger                                      | Qué hace                                                                                                                                        |
| -------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `pr-validation.yml`        | PR contra `gorazus2`                         | `nx affected`: lint (incl. fronteras Nx) → build (gate de tipos) → test. **Nuevo esta sesión**: job `docker-build` (api + web, sin push)        |
| `security.yml`             | PR/push a `gorazus2` + cron semanal          | `pnpm audit` (no bloqueante, `\|\| true` — ver [DEPENDENCY_REPORT.md](./DEPENDENCY_REPORT.md) §4) + CodeQL SAST                                 |
| `deploy-staging.yml`       | push a `gorazus2`                            | Build de imágenes Docker completo (no solo lo afectado) — push/kubectl quedan como placeholder, registry/cluster reales sin provisionar todavía |
| `deploy-production.yml`    | manual (no revisado — sin referencia a rama) | Deploy a producción                                                                                                                             |
| `nightly-restore-test.yml` | cron (no revisado — sin referencia a rama)   | Prueba de restore de backup                                                                                                                     |

## 3. Docker build en PR validation — nuevo esta sesión

Antes, el build de imagen Docker solo se ejecutaba en `deploy-staging.yml`
(al hacer push a la rama principal) — un PR que rompiera el `Dockerfile` o
el build de producción de `api`/`web` recién se hubiera descubierto al
desplegar, no antes de mergear. `pr-validation.yml` ahora tiene un job
`docker-build` que corre `docker build --target production` para ambos
(sin push, sin registry). Verificado localmente esta sesión: ambas imágenes
compilan limpio.

## 4. Evaluado y explícitamente NO aplicado esta sesión

### 4.1 Validación de OpenAPI en CI

El spec OpenAPI (`docs/api/openapi.json`) se genera como efecto secundario
de que la aplicación **bootee completa** (`core/kernel/bootstrap.ts`,
`SwaggerModule.createDocument` corre después de que `NestFactory.create`
resuelve todo el grafo de módulos — los 21 clientes Prisma, Redis,
RabbitMQ). Un job de CI que valide/diffee ese spec necesitaría contenedores
de servicio reales (Postgres/Redis/RabbitMQ/MinIO) corriendo dentro del
runner de GitHub Actions, del mismo tipo de infraestructura que ya
necesitan los tests e2e reales de `auth-backend`/`seguridad-backend` —
que **hoy tampoco corren en CI** (ver §4.3). Añadir esto a medias (sin la
infraestructura de servicios) sería un paso de CI que falla siempre — se
documenta como trabajo futuro, dimensionado junto con el punto siguiente,
no como un checkbox marcado a medias.

### 4.2 ESLint type-aware/strict (`recommendedTypeChecked`)

Se probó activar `tseslint.configs.recommendedTypeChecked` (equivalente a
subir el nivel de PHPStan del pedido original) — el propio paquete
`core-cache` pasó limpio tras corregir 3 errores reales
(`require-await`) en el spec nuevo de esta sesión. Al correr sobre el
monorepo completo (`nx run-many -t lint`), tanto en paralelo como
secuencial (`--parallel=1`), el proceso de Node se quedó sin memoria
(`JavaScript heap out of memory`) al tipar-chequear los proyectos con
grafo de dependencias más grande (`api`, `web`) — el parseo type-aware de
ESLint carga el programa de TypeScript completo por archivo, mucho más
caro que el chequeo de tipos no-type-aware ya usado (`tseslint.configs.recommended`).

**No se puede confirmar en este entorno cuántos errores reales de tipo
existen** en el resto del monorepo (~20 proyectos no llegaron a evaluarse
antes del crash) — revertido a `recommendedTypeChecked` → `recommended`
(estado original) en vez de mergear una config no verificada. Queda como
recomendación para una sesión dedicada, corriendo proyecto por proyecto o
con más memoria disponible (`NODE_OPTIONS=--max-old-space-size=...`),
antes de decidir si el gate de CI puede sostener el costo de memoria en un
runner real de GitHub Actions.

### 4.3 Tests e2e con infraestructura real en CI

`pr-validation.yml`'s job `affected` corre `nx affected -t test` sin
contenedores de servicio — si algún día un PR afecta un `*.e2e-spec.ts`
(los de `auth-backend`/`seguridad-backend` que sí corren contra Postgres/
Redis real, confirmados esta sesión), ese paso fallaría en el runner por
falta de infraestructura. No se tocó esta sesión: agregar
`services: postgres/redis/rabbitmq/minio` a `pr-validation.yml` con la
inicialización/migraciones correctas es un cambio de CI con alcance propio
— relacionado con el punto 4.1, mismo prerequisito.
