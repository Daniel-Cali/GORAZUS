# Dependency Report — GORAZUS ERP

> Estado de dependencias a 2026-07-21. Generado como entregable de la sesión
> "Fase 2, Parte 1 — Infraestructura Backend Enterprise" (rama `gorazus2`).

## 1. Stack real (no es PHP)

El pedido original de esta fase listaba estándares PHP (PSR-12, PHPStan,
PHP CS Fixer, PHPUnit) — este repo es un monorepo Nx/pnpm en **Node.js 20 +
TypeScript 5.7**, backend NestJS 10, frontend React 19 + Vite. Los
equivalentes reales ya están en uso: ESLint 9 + Prettier (PSR-12/CS Fixer),
TypeScript `strict` (PHPStan), Jest 29 (PHPUnit), `@nestjs/swagger`
(OpenAPI, ya generado automáticamente al boot — ver
`core/kernel/bootstrap.ts`).

## 2. Versiones clave

| Paquete                     | Versión     | Dónde                             |
| --------------------------- | ----------- | --------------------------------- |
| `typescript`                | ^5.7.0      | raíz                              |
| `nx`                        | ^20.3.0     | raíz                              |
| `@nestjs/core`              | ^10.4.0     | `apps/api`, `core/database`, etc. |
| `@prisma/client` / `prisma` | ^5.22.0     | `core/database`                   |
| `jest`                      | ^29.7.0     | raíz                              |
| `eslint`                    | ^9.17.0     | raíz                              |
| `@playwright/test`          | ^1.49.0     | `apps/web-e2e`                    |
| `packageManager`            | pnpm@9.15.0 | `package.json`                    |

`node >= 20.0.0`, `pnpm >= 9.0.0` (`engines`, `package.json`).

## 3. `packages/tooling/utils` no es un paquete pnpm real

No tiene `package.json` propio — se importa por ruta relativa
(`../../packages/tooling/utils`) con
`// eslint-disable-next-line @nx/enforce-module-boundaries` en cada punto de
uso, convención ya establecida antes de esta sesión (ej.
`core/notifications/integrations/whatsapp-credentials.service.ts`). Esta
sesión siguió el mismo patrón al construir `core/cache/lock.service.ts`, y
tuvo que replicar el `rootDir: "../.."` que `core/notifications/tsconfig.json`
ya usaba para que `tsc` pudiera compilar a través de esa frontera — el
executor `@nx/js:tsc` (a diferencia de invocar `tsc` directo vía
`nx:run-commands`) ignora ese `rootDir` del tsconfig y sigue fallando, así
que `core/cache`'s build target se cambió al mismo patrón `nx:run-commands`

- `tsc -p` que ya usaba `core-notifications` (ver
  `core/cache/project.json`). Puramente mecánico — no cambia qué se compila,
  solo cómo se invoca `tsc`.

## 4. Auditoría de seguridad (`pnpm audit --audit-level=moderate`)

**35 vulnerabilidades** (1 crítica, 15 altas, 18 moderadas, 1 baja) —
todas en dependencias transitivas de tooling/observabilidad (confirmado por
`pnpm why` en las principales: `multer` vía `@nestjs/platform-express`,
`js-yaml` vía `@nestjs/swagger`, ninguna en dependencias directas de
negocio).

Esto **no es nuevo de esta sesión** — ya documentado en `CHANGELOG.md` como
"Pendiente conocido" (34 vulnerabilidades al activar el gate, ahora 35 — una
más, deriva normal de `pnpm audit`'s base de datos de CVEs, no de un cambio
de dependencias esta sesión). `security.yml` corre `pnpm audit` con `|| true`
(no bloquea el merge) explícitamente hasta que ese punch list se resuelva
con tiempo dedicado de regresión — decisión ya tomada, no revisitada acá.
Resolverlo real (bump/replace de cada dependencia transitiva, con
regresión completa) es un trabajo separado, no de infraestructura.

## 5. Conexiones de base de datos — 21 clientes Prisma sin límite de pool

**Corregido esta sesión** (ver `core/database/src/database.module.ts`): cada
uno de los 21 `PrismaClient` (uno por schema de Postgres) abría su propio
pool con el default de Prisma (`num_physical_cpus * 2 + 1` **por cliente**)
— en un host de 8 cores, hasta 357 conexiones posibles contra un Postgres
configurado con `max_connections = 100`
(`infra/postgres/postgresql.conf`), incluso en desarrollo, con solo 3 de
los 21 schemas realmente en uso hoy (`auth`, `seguridad`,
`configuracion`). Se acotó cada cliente a `connection_limit=4` (84 en
total), verificado contra Postgres real vía el suite e2e de
`password-reset` de `auth-backend`.

## 6. No revisado esta sesión

- `pnpm outdated` (versiones desactualizadas sin vulnerabilidad conocida) —
  no forma parte del pedido explícito ("no dependencias innecesarias", que
  sí se verificó por inspección: no se encontró dependencia muerta
  evidente en los paquetes tocados).
- Licencias de dependencias transitivas — fuera de alcance de esta fase.
