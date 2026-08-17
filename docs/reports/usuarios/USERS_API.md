# Users API — referencia legible

> Entregable FASE 03, Parte 03 (Gestión de Usuarios Enterprise,
> 2026-07-22). Documentación legible de `modules/seguridad/backend`'s
> `UsuariosController` — basada en el código real (controller/servicios/
> validators). **No reemplaza** a `docs/api/openapi.json` (el spec
> OpenAPI 3 real, auto-generado desde los decoradores `@nestjs/swagger`
> al bootear la app) — ese archivo requiere Docker arriba (Postgres) para
> regenerarse, no disponible al escribir este documento (ver
> `USERS_TEST_REPORT.md §3`, mismo bloqueo documentado en
> `OPENAPI_AUTH.md` para FASE 03 Parte 02). Todos los endpoints ya tienen
> los decoradores `@ApiOperation`/`@ApiResponse`/`@ApiBearerAuth`/
> `@RequirePermission` en el código, listos para aparecer solos la
> próxima vez que la app bootee con acceso a la base.

Base: `/api/v1/seguridad/usuarios`. Envelope de éxito `{ data: ... }`;
errores `{ error: { code, message, details } }` (`ExceptionFilter`
global). Todos requieren `Authorization: Bearer <accessToken>` salvo que
se indique lo contrario. "Admin" = requiere permiso
`seguridad.gestionar_usuarios`.

## Autoservicio (`/me`)

| Método y ruta            | Descripción                                                                                        |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| `GET /me`                | Mi perfil (sin `password_hash`)                                                                    |
| `PATCH /me`              | `{ fullName, email? }` — nombre obligatorio, correo opcional                                       |
| `PATCH /me/password`     | `{ currentPassword, newPassword }` — exige la actual                                               |
| `GET /me/preferencias`   | Preferencias (idioma/zonaHoraria/tema/formatos/página inicial/registros por página/notificaciones) |
| `PATCH /me/preferencias` | PATCH parcial — cualquier subconjunto de las preferencias                                          |
| `POST /me/avatar`        | Multipart, campo `file` (máx. 5MB) → `{ avatarKey, avatarUrl }`                                    |
| `DELETE /me/avatar`      | Borra la foto (204, idempotente)                                                                   |

## Administración (todas requieren `seguridad.gestionar_usuarios`)

| Método y ruta                     | Descripción                                                                      |
| --------------------------------- | -------------------------------------------------------------------------------- |
| `GET /`                           | Listar (paginado)                                                                |
| `GET /:id`                        | Ver un usuario por id                                                            |
| `POST /`                          | `{ email, fullName }` → 201, `{ usuario, passwordTemporal }`                     |
| `PUT /:id`                        | `{ fullName?, email? }` — al menos uno, PATCH parcial                            |
| `PATCH /:id/status`               | `{ status: 'active'\|'inactive'\|'suspended'\|'blocked'\|'pending_activation' }` |
| `PATCH /:id/password`             | Sin body — resetea, devuelve `{ usuario, passwordTemporal }`                     |
| `DELETE /:id`                     | Soft delete (204) — `deleted_at`                                                 |
| `POST /:id/restore`               | Revierte el soft delete                                                          |
| `POST /:id/activar`               | Atajo de `status: 'active'` (preexistente)                                       |
| `POST /:id/desactivar`            | Atajo de `status: 'inactive'` (preexistente)                                     |
| `GET /:id/historial`              | Auditoría (`core.audit_logs`, vía trigger genérico)                              |
| `POST /:id/roles`                 | `{ rolId }` — asignar                                                            |
| `DELETE /:id/roles/:rolId`        | Revocar                                                                          |
| `GET /:id/empresas`               | Listar empresas asignadas (`core.user_companies`)                                |
| `POST /:id/empresas`              | `{ companyId, isDefault? }` — asignar                                            |
| `DELETE /:id/empresas/:companyId` | Desasignar                                                                       |

## Errores específicos de este módulo

| Código                     | HTTP | Cuándo                                                                                              |
| -------------------------- | ---- | --------------------------------------------------------------------------------------------------- |
| `EMAIL_YA_REGISTRADO`      | 409  | Correo ya en uso (crear/editar/autoedición)                                                         |
| `USUARIO_NO_ENCONTRADO`    | 404  | `:id` inexistente                                                                                   |
| `USUARIO_ELIMINADO`        | 409  | `:id` corresponde a un usuario ya eliminado (soft delete) — restauralo primero (`POST :id/restore`) |
| `PASSWORD_ACTUAL_INVALIDA` | 400  | `PATCH /me/password` con la actual incorrecta                                                       |
| `EMPRESA_INACTIVA`         | 409  | Asignar una empresa dada de baja                                                                    |
| `EMPRESA_YA_ASIGNADA`      | 409  | Asignar una empresa que el usuario ya tiene                                                         |
| `ASIGNACION_NO_ENCONTRADA` | 404  | Desasignar una empresa que no estaba asignada                                                       |
| `ARCHIVO_DEMASIADO_GRANDE` | 400  | Avatar > 5MB                                                                                        |

`USUARIO_ELIMINADO` la lanza `obtenerCrudo()` (usado por casi todo el
servicio: editar, cambiar estado, resetear contraseña, asignar rol,
autoedición/autopassword, multiempresa) — `findById` de `BaseRepository`
no filtra `deleted_at` (a diferencia de `findMany`, que sí lo hace vía
`notDeletedFilter()`), así que sin este chequeo esas operaciones
seguirían funcionando en silencio contra un usuario ya eliminado.
`restaurar` es la única excepción deliberada: necesita encontrar al
usuario aunque esté eliminado, así que no pasa por `obtenerCrudo()`.
