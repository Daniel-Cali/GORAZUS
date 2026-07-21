# API — GORAZUS ERP Backend

Fuente de verdad: [openapi.json](openapi.json), exportado automáticamente por el backend en cada
arranque no-productivo (`core/kernel/bootstrap.ts`) — importalo directo en Postman/Insomnia, no
mantener una colección aparte a mano. Este documento es un índice de lectura rápida, no reemplaza
al spec.

Prefijo de todas las rutas: `/api/v1`. Formato de error: ver
`docs/architecture/07-convenciones-y-estandares.md` (`{ error: { code, message, details } }`).
Autenticación: Bearer JWT (`Authorization: Bearer <accessToken>`) salvo los endpoints marcados
`@Public()` (`login`, `refresh`, `forgot-password`, `reset-password`).

## `auth` — autenticación

| Método | Ruta                    | Descripción                                                                                                                                                         |
| ------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/auth/login`           | Resuelve tenant por `tenantSlug`, valida credenciales, emite JWT + cookie httpOnly de refresh.                                                                      |
| POST   | `/auth/refresh`         | Rota el refresh token (cookie), emite un nuevo access token.                                                                                                        |
| POST   | `/auth/logout`          | Revoca la sesión actual.                                                                                                                                            |
| POST   | `/auth/forgot-password` | Genera un token de restablecimiento — siempre responde 200 (anti-enumeración). El token se entrega vía log (`LoggingPasswordResetNotifier`, canal email pendiente). |
| POST   | `/auth/reset-password`  | Consume el token, fija la nueva contraseña, revoca todas las sesiones del usuario.                                                                                  |

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

2FA es "preparado": el mecanismo (setup/confirmar/deshabilitar) es real y funcional, pero todavía
no es un paso obligatorio de `POST /auth/login` — ver `CHANGELOG.md`.

## `health` — probes de infraestructura (sin auth, `@Public()`)

| Método | Ruta            | Descripción      |
| ------ | --------------- | ---------------- |
| GET    | `/health/live`  | Liveness probe.  |
| GET    | `/health/ready` | Readiness probe. |
