# API Report — GORAZUS ERP

> FASE 03 — Backend Core Enterprise, Parte 01 (auditoría). Sesión del
> 2026-07-23, versión **0.3.1**. Estado ACTUAL completo de la API — no
> solo lo nuevo de una sesión puntual (para eso ver `CHANGELOG.md`).
> Reemplaza como fuente de verdad al `API_REPORT.md` anterior (sesión
> "Backend Core", 2026-07-22), que era un reporte de delta.

## 1. Inventario — 38 rutas reales

Fuente de verdad real: [docs/api/openapi.json](./docs/api/openapi.json)
(regenerado con un boot real de la app, última vez el 2026-07-22, sin
cambios de código desde entonces — sigue vigente). Índice legible:
[docs/api/API.md](./docs/api/API.md).

| Módulo          | Rutas  | Autenticación                                                                                           |
| --------------- | :----: | ------------------------------------------------------------------------------------------------------- |
| `auth`          |   6    | `@Public()` en todas (login, login/2fa, refresh, logout*, forgot/reset-password) — *logout exige Bearer |
| `configuracion` |   13   | Bearer + RBAC (`configuracion.gestionar_*`)                                                             |
| `seguridad`     |   13   | Bearer + RBAC (`seguridad.gestionar_*`) o self-service                                                  |
| `files`         |   3    | Bearer (sin RBAC específico — cualquier usuario autenticado, bucket aislado por tenant)                 |
| `health`        |   2    | `@Public()` (probes de infraestructura)                                                                 |
| **Total**       | **38** |                                                                                                         |

## 2. Versionado

Prefijo único `/api/v1/...` (`app.setGlobalPrefix('api')` +
`app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })`,
`core/kernel/bootstrap.ts`). Sin `v2` todavía — ningún endpoint necesitó
un cambio breaking hasta ahora.

## 3. OpenAPI/Swagger

Generado automáticamente en cada arranque no-productivo
(`SwaggerModule.createDocument` + `writeFileSync` a
`docs/api/openapi.json`) — no es una colección mantenida a mano. Deuda
menor detectada esta auditoría: `info.version` queda hardcodeado a
`"0.1.0"` en el `DocumentBuilder`, sin seguir la versión real del
proyecto (`0.3.1`) — ver `TECHNICAL_DEBT.md §4`.

## 4. Convenciones aplicadas consistentemente

- **Envelope de respuesta**: `{ data: ... }` en éxito, `{ error: { code,
message, details } }` en error — sin excepción en los 38 endpoints.
- **Paginación**: patrón compartido (`PaginationParams`/
  `PaginatedResult`, `core/database/src/base.repository.ts`) — página +
  tamaño de página, nunca cursor. **Sin patrón compartido de
  sort/filter/search** todavía (cada controller lo resuelve ad hoc) — ver
  `TECHNICAL_DEBT.md §2`.
- **Idioma**: dominio de negocio en español (`empresas`, `sucursales`,
  `usuarios`), términos técnicos en inglés (`controller`, `guard`,
  `repository`) — nunca mezclados dentro del mismo identificador.

## 5. Seguridad de la capa API

Ver `SECURITY_REPORT.md` para el detalle completo. Resumen aplicable a
TODA la API (no solo `auth`):

- `helmet()` + CORS con origen exacto (`CORS_ORIGIN`, nunca `*`).
- Rate limiting global (100 req/60s por IP, `ThrottlerGuard`) + límite
  propio más estricto en `/auth/login`/`/auth/login/2fa` (5 req/60s).
- `JwtAuthGuard` global — cualquier ruta requiere Bearer salvo
  `@Public()` explícito.
- `PermissionsGuard` global — fail-closed (deniega por default hasta que
  `seguridad` registre un resolver real).
- `TenantInterceptor` — resuelve el `UserContext` completo (incluye
  tenant/empresa/sucursal) antes de que corra cualquier handler.

## 6. Multiempresa en la API

`tenant_id` resuelto en `auth`/`login` por `tenantSlug` explícito en el
body (nunca implícito por subdominio todavía). `company_id`/`branch_id`
viajan en el JWT (`AccessTokenPayload`) y se propagan vía RLS
(`app.current_tenant_id`/`app.current_company_ids`, seteados por
`withTenantScope` en cada repositorio) — nunca un `WHERE tenant_id = ...`
manual en código de aplicación. `warehouse_id` **no existe todavía en
ningún endpoint** — depende de que `modules/inventario` (Almacenes) se
construya, ver `ROADMAP.md`.

## 7. No verificado esta sesión

- Import real del spec en Postman/Insomnia — solo se confirmó que el
  JSON es válido y contiene las rutas esperadas.
- Swagger UI (`GET /docs`) en navegador — no abierto esta sesión.
- Cualquier endpoint contra infraestructura real — Docker no disponible,
  ver `BACKEND_HEALTH_REPORT.md §4`.
