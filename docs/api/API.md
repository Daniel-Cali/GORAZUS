# API — GORAZUS ERP Backend

Fuente de verdad: [openapi.json](openapi.json), exportado automáticamente por el backend en cada
arranque no-productivo (`core/kernel/bootstrap.ts`) — importalo directo en Postman/Insomnia, no
mantener una colección aparte a mano. Este documento es un índice de lectura rápida, no reemplaza
al spec.

Prefijo de todas las rutas: `/api/v1`. Formato de error: ver
`docs/architecture/07-convenciones-y-estandares.md` (`{ error: { code, message, details } }`).
Autenticación: Bearer JWT (`Authorization: Bearer <accessToken>`) salvo los endpoints marcados
`@Public()` (`login`, `login/2fa`, `refresh`, `forgot-password`, `reset-password`).

## `auth` — autenticación

| Método | Ruta                    | Descripción                                                                                                                                                                                                                                                                   |
| ------ | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/auth/login`           | Resuelve tenant por `tenantSlug`, valida credenciales. Si el usuario tiene 2FA confirmado devuelve `{ requiresTwoFactor: true, challengeToken }` sin tokens; si no, emite JWT + cookie httpOnly de refresh directo. 5 req/60s propio; bloquea la cuenta 15 min tras 5 fallos. |
| POST   | `/auth/login/2fa`       | Segundo paso — `{ challengeToken, code }` (TOTP). Completa lo que `login` dejó pendiente, emite JWT + cookie de refresh.                                                                                                                                                      |
| POST   | `/auth/refresh`         | Rota el refresh token (cookie, `SameSite=Strict` + chequeo de `Origin`), emite un nuevo access token.                                                                                                                                                                         |
| POST   | `/auth/logout`          | Revoca la sesión actual — el access token deja de ser válido de inmediato (antes seguía vivo hasta expirar solo, ~15 min).                                                                                                                                                    |
| POST   | `/auth/forgot-password` | Genera un token de restablecimiento — siempre responde 200 (anti-enumeración). El link se entrega por email real (`EmailPasswordResetNotifier`, SMTP/MailHog en dev).                                                                                                         |
| POST   | `/auth/reset-password`  | Consume el token, fija la nueva contraseña, revoca todas las sesiones del usuario.                                                                                                                                                                                            |

## `configuracion` — Core (catálogos maestros)

| Método    | Ruta                               | Descripción                                                                | Permiso RBAC                         |
| --------- | ---------------------------------- | -------------------------------------------------------------------------- | ------------------------------------ |
| GET/POST  | `/configuracion/empresas`          | Listar / crear empresas.                                                   | `configuracion.gestionar_empresas`   |
| GET/PATCH | `/configuracion/empresas/{id}`     | Obtener / actualizar una empresa.                                          | `configuracion.gestionar_empresas`   |
| GET/POST  | `/configuracion/sucursales`        | Listar (filtrable por `companyId`) / crear sucursales.                     | `configuracion.gestionar_sucursales` |
| GET/PATCH | `/configuracion/sucursales/{id}`   | Obtener / actualizar una sucursal.                                         | `configuracion.gestionar_sucursales` |
| GET/POST  | `/configuracion/parametros`        | Listar / crear parámetros del sistema.                                     | `configuracion.gestionar_parametros` |
| GET       | `/configuracion/parametros/{key}`  | Obtener un parámetro por clave.                                            | `configuracion.gestionar_parametros` |
| GET       | `/configuracion/valores/{key}`     | Valor efectivo (override o default) de un parámetro para el tenant actual. | `configuracion.gestionar_parametros` |
| PUT       | `/configuracion/valores`           | Fijar (crear o actualizar) el valor de un parámetro.                       | `configuracion.gestionar_parametros` |
| GET/POST  | `/configuracion/monedas`           | Listar / crear monedas ISO 4217.                                           | `configuracion.gestionar_monedas`    |
| GET       | `/configuracion/monedas/{isoCode}` | Obtener una moneda por código ISO.                                         | `configuracion.gestionar_monedas`    |
| GET/POST  | `/configuracion/impuestos`         | Listar / crear perfiles de impuesto.                                       | `configuracion.gestionar_impuestos`  |
| GET       | `/configuracion/impuestos/{id}`    | Obtener un impuesto por id.                                                | `configuracion.gestionar_impuestos`  |
| GET/POST  | `/configuracion/tasas-impuesto`    | Listar (filtrable por `taxId`) / crear tasas de un impuesto.               | `configuracion.gestionar_impuestos`  |

Impuestos es de alcance mínimo (perfil + tasas, sin motor de reglas/cálculo/percepciones/
retenciones) — ver `CHANGELOG.md`. `taxes.taxes.jurisdiction_id` requiere una jurisdicción fiscal
ya sembrada vía `modules/configuracion/backend/scripts/seed-tax-jurisdictions.ts` (no hay endpoint
de catálogo de países/jurisdicciones todavía).

## `seguridad` — RBAC, usuarios, auditoría, sesiones, 2FA

| Método   | Ruta                                  | Descripción                                                                    | Permiso RBAC / alcance            |
| -------- | ------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------- |
| GET/POST | `/seguridad/roles`                    | Listar / crear roles.                                                          | `seguridad.gestionar_roles`       |
| POST     | `/seguridad/roles/{id}/permisos`      | Asignar un permiso a un rol.                                                   | `seguridad.gestionar_roles`       |
| GET      | `/seguridad/usuarios/me`              | Ver mi propio perfil.                                                          | Self-service (solo autenticación) |
| PATCH    | `/seguridad/usuarios/me`              | Editar mi propio perfil (solo `fullName`).                                     | Self-service                      |
| PATCH    | `/seguridad/usuarios/me/password`     | Cambiar mi propia contraseña (exige la actual).                                | Self-service                      |
| GET/POST | `/seguridad/usuarios`                 | Listar / crear usuarios (alta con contraseña temporal).                        | `seguridad.gestionar_usuarios`    |
| POST     | `/seguridad/usuarios/{id}/desactivar` | Baja lógica (`is_active=false`).                                               | `seguridad.gestionar_usuarios`    |
| POST     | `/seguridad/usuarios/{id}/activar`    | Reactivación — simétrico a `desactivar`.                                       | `seguridad.gestionar_usuarios`    |
| GET      | `/seguridad/usuarios/{id}/historial`  | Historial de cambios (reusa `core.audit_logs`).                                | `seguridad.gestionar_usuarios`    |
| POST     | `/seguridad/usuarios/{id}/roles`      | Asignar un rol a un usuario.                                                   | `seguridad.gestionar_usuarios`    |
| GET      | `/seguridad/auditoria`                | Listar `core.audit_logs`, filtrable por `tableName`/`operation`/`actorUserId`. | `seguridad.ver_auditoria`         |
| GET      | `/seguridad/sesiones`                 | Listar sesiones de un usuario (`?userId=`), ordenadas por más recientes.       | `seguridad.gestionar_sesiones`    |
| POST     | `/seguridad/sesiones/{id}/revocar`    | Revocar una sesión puntual.                                                    | `seguridad.gestionar_sesiones`    |
| POST     | `/seguridad/2fa/setup`                | Generar un secreto TOTP nuevo, sin confirmar.                                  | Self-service                      |
| POST     | `/seguridad/2fa/confirmar`            | Confirmar con un código TOTP real, activa 2FA.                                 | Self-service                      |
| DELETE   | `/seguridad/2fa`                      | Deshabilitar 2FA.                                                              | Self-service                      |

2FA ya es un paso obligatorio del login para quien lo tenga confirmado — ver `/auth/login` y
`/auth/login/2fa` arriba, y `CHANGELOG.md`.

## `files` — almacenamiento genérico (MinIO)

| Método | Ruta           | Descripción                                                                                             |
| ------ | -------------- | ------------------------------------------------------------------------------------------------------- |
| POST   | `/files`       | Subir un archivo (`multipart/form-data`, campo `file`, máx. 25MB). Devuelve `key`/`contentType`/`size`. |
| GET    | `/files/{key}` | URL firmada de descarga (~5 min) — nunca credenciales de MinIO directas al cliente.                     |
| DELETE | `/files/{key}` | Borrar (idempotente).                                                                                   |

Bucket por tenant (`archivos-<tenantId>`), no uno global. Sin tabla de metadata propia todavía — el
`key` devuelto se guarda en la columna `metadata JSONB` del registro de negocio que lo necesite,
cuando exista ese módulo.

## `health` — probes de infraestructura (sin auth, `@Public()`)

| Método | Ruta            | Descripción      |
| ------ | --------------- | ---------------- |
| GET    | `/health/live`  | Liveness probe.  |
| GET    | `/health/ready` | Readiness probe. |
