# API Report — GORAZUS ERP

> Fase 2 — Desarrollo del Backend Core. Sesión del 2026-07-22, versión
> **0.3.0**. Inventario real de la API tras esta sesión — fuente de verdad
> real es [docs/api/openapi.json](./docs/api/openapi.json) (regenerado esta
> sesión, ver [OPENAPI_REPORT.md](./OPENAPI_REPORT.md)); este documento es
> un resumen legible, no lo reemplaza. Índice rápido por ruta:
> [docs/api/API.md](./docs/api/API.md) (actualizado esta sesión).

## 1. Endpoints — 38 rutas totales, 4 nuevas esta sesión

| Ruta              | Método | Nuevo | Descripción                                                               |
| ----------------- | ------ | :---: | ------------------------------------------------------------------------- |
| `/auth/login/2fa` | POST   |  ✅   | Segundo paso del login — completa un `challengeToken` con un código TOTP. |
| `/files`          | POST   |  ✅   | Subir un archivo (multipart), bucket por tenant.                          |
| `/files/{key}`    | GET    |  ✅   | URL firmada de descarga (~5 min).                                         |
| `/files/{key}`    | DELETE |  ✅   | Borrar un archivo.                                                        |

Las 34 rutas restantes (auth, configuracion, seguridad, health) ya existían
de sesiones previas — sin cambios de contrato, solo comportamiento interno
(`/auth/login` ahora puede devolver una forma distinta de respuesta cuando
hay 2FA, ver §2; `/auth/refresh`/`/auth/logout` se endurecieron, sin cambio
de forma de request/response).

## 2. Cambio de contrato: `POST /auth/login`

Antes: siempre devolvía `{ data: { accessToken, user, activeCompanyId,
activeBranchId } }`. Ahora es una de dos formas, misma respuesta 200:

```jsonc
// Sin 2FA (comportamiento sin cambios)
{ "data": { "accessToken": "...", "user": {...}, "activeCompanyId": null, "activeBranchId": null } }

// Con 2FA confirmado (nuevo)
{ "data": { "requiresTwoFactor": true, "challengeToken": "..." } }
```

Retrocompatible para cualquier cliente sin usuarios con 2FA activo (0 hoy en
el tenant `demo` fuera de los de prueba) — pero cualquier consumidor futuro
del endpoint debe chequear `requiresTwoFactor` antes de asumir que
`accessToken` viene en la respuesta. Documentado en el Swagger del endpoint
(`TwoFactorRequiredResponseDto`, `modules/auth/backend/dto/login-response.dto.ts`).

## 3. Nuevos códigos de error

| Código                          | HTTP | Endpoint               | Cuándo                                                                       |
| ------------------------------- | ---- | ---------------------- | ---------------------------------------------------------------------------- |
| `CUENTA_BLOQUEADA`              | 429  | `POST /auth/login`     | 5+ intentos fallidos en 15 minutos para ese (tenant, email).                 |
| `CODIGO_DOS_FACTORES_INVALIDO`  | 400  | `POST /auth/login/2fa` | El código TOTP no coincide (challengeToken sigue vivo, se puede reintentar). |
| `DESAFIO_DOS_FACTORES_INVALIDO` | 401  | `POST /auth/login/2fa` | `challengeToken` inexistente/expirado/ya consumido.                          |
| (genérico `ForbiddenException`) | 403  | `POST /auth/refresh`   | Header `Origin` presente y distinto de `CORS_ORIGIN`.                        |

## 4. Rate limiting — cambio de política

`/auth/login` y `/auth/login/2fa` ahora tienen su propio límite
(`@Throttle`, 5 req/60s) más estricto que el global (100 req/60s,
`core/http/http.module.ts`, sin cambios). Cualquier cliente que hiciera más
de 5 intentos de login por minuto (ej. un test automatizado, un script de
provisioning) empieza a recibir 429 donde antes no — impacto real
encontrado y resuelto en los propios tests e2e de esta sesión (ver
[TEST_REPORT.md](./TEST_REPORT.md) §3).

## 5. `files` — diseño de API

- Un bucket MinIO por tenant (`archivos-<tenantId>`), nunca uno global —
  aislamiento multi-tenant al nivel de storage, no de fila.
- `GET /files/:key` nunca devuelve el archivo ni credenciales de MinIO —
  siempre una URL firmada de corta duración, coherente con el resto de la
  plataforma (`docs/architecture/08-infraestructura-y-despliegue.md §5`).
- Sin endpoint de "listar archivos de un tenant" — deliberado: sin tabla de
  metadata propia, no hay forma de listar más allá de lo que MinIO expone
  (fuera de alcance de esta fase). Cada módulo de negocio que empiece a usar
  esto debe guardar el `key` en su propio registro.

## 6. No tocado esta sesión

- Paginación/filtrado: patrón ya existente (`PaginationParams`/
  `PaginatedResult`, `core/database/src/base.repository.ts`) sin cambios.
  Sigue sin un patrón compartido de sort/search — ver `CHANGELOG.md`
  "Pendiente conocido".
- Versionado de API (`/api/v1/...`) — sin cambios, sigue en v1 única.
