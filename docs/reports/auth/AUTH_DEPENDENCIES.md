# Auth Dependencies — GORAZUS ERP

> Fase 2, Parte 2.1. Dependencias reales de `modules/auth/backend`
> (`package.json`, pnpm workspace) — mapeadas contra la lista pedida por
> esa parte (JWT/UUID/Carbon/PSR Logger/Validation/OpenAPI, en términos
> genéricos) a lo que este stack realmente usa. Sin dependencias nuevas
> en FASE 03 Parte 02 (Autenticación Enterprise) — toda la funcionalidad
> nueva se construyó sobre lo ya mapeado acá.

## 1. Mapeo pedido → real

| Pedido (genérico)           | Real en este stack                                        | Dónde                                                                                                      |
| --------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| JWT (Firebase JWT o equiv.) | `jsonwebtoken` 9.0.2                                      | `services/issue-login-session.service.ts`, `refresh-token.usecase.ts`, `services/jwt-token.provider.ts` 🆕 |
| UUID                        | `node:crypto randomUUID()` (envuelta en `generateUuid()`) | `packages/tooling/utils/uuid.ts` — sin librería externa                                                    |
| Carbon (fechas)             | `Date` nativo + `Clock`/`SystemClock`/`FixedClock`        | `packages/tooling/utils/clock.ts` — sin librería de fechas externa                                         |
| PSR Logger                  | `LoggerService` (`core/logging`, propio)                  | Inyectado donde hace falta — sin `winston`/`pino` expuesto directo                                         |
| Validation                  | `zod` 3.24.0                                              | `validators/*.schema.ts` — no `class-validator` (decisión ya tomada, `docs/architecture` lo documenta)     |
| OpenAPI                     | `@nestjs/swagger` 7.4.0                                   | `dto/login-response.dto.ts`, decorators `@Api*` en `auth.controller.ts`                                    |

## 2. `package.json` real — dependencias directas

```json
"dependencies": {
  "@gorazus/contracts": "workspace:*",
  "@gorazus/core-cache": "workspace:*",
  "@gorazus/core-database": "workspace:*",
  "@gorazus/core-http": "workspace:*",
  "@nestjs/common": "^10.4.0",
  "@nestjs/config": "^3.3.0",
  "@nestjs/core": "^10.4.0",
  "@nestjs/swagger": "^7.4.0",
  "@nestjs/throttler": "^6.2.0",
  "jsonwebtoken": "^9.0.2",
  "nodemailer": "^9.0.3",
  "reflect-metadata": "^0.2.0",
  "rxjs": "^7.8.0",
  "zod": "^3.24.0"
}
```

Sin cambios esta parte — todo lo agregado (`value-objects/`, `events/`,
`jwt-token.provider.ts`) usa exclusivamente lo que ya estaba declarado
(`jsonwebtoken`, `@gorazus/core-http` para `DomainException`). `core/http`
sí ganó una dependencia nueva (`jsonwebtoken`, para `GuestGuard`) — ver §3.

## 3. `core/http` — nueva dependencia esta parte

`GuestGuard` (🆕) necesita verificar un JWT por su cuenta — `core/http` no
tenía `jsonwebtoken` como dependencia directa (usaba `passport-jwt`, que
NO expone `jwt.verify()` como función suelta, solo como parte del ciclo
de vida de una `Strategy`). Agregado:

```diff
  "dependencies": {
+   "jsonwebtoken": "^9.0.2",
    ...
  },
  "devDependencies": {
+   "@types/jsonwebtoken": "^9.0.7",
    ...
  }
```

## 4. Por qué NO se creó `packages/tooling/utils/jwt.ts`

Intento real, revertido en la misma sesión (ver `AUTH_ARCHITECTURE.md
§4`): `packages/tooling/utils` no tiene `package.json` propio, resuelve
`node_modules` desde la raíz del monorepo — solo puede depender de lo que
esté en el `package.json` de la RAÍZ. `argon2` está ahí (por eso
`hash.ts` funciona); `jsonwebtoken` no. Confirmado con un error real de
TypeScript (`Cannot find module 'jsonwebtoken'`) al intentar poner el JWT
Provider ahí primero — movido a `modules/auth/backend/services/` en su
lugar, mismo espíritu de función pura, sin la restricción de resolución.

## 5. Sin dependencias nuevas de negocio

Ninguna dependencia de `modules/seguridad`/`modules/configuracion` — `auth`
sigue sin importar ningún otro módulo de negocio
(`@nx/enforce-module-boundaries` lo verifica en cada lint). Las tablas
`security.login_attempts`/`security.two_factor_credentials` se leen vía
`PRISMA_SECURITY` (token de `@gorazus/core-database`, `type:core`), no vía
un import cruzado de módulo.
