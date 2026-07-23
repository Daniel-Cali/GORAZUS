# Users API Report — FASE 03, Parte 03

> Entregable de esta parte. Ver `USERS_API.md` para el contrato completo
> de cada endpoint (request/response/errores) — este documento resume
> QUÉ cambió en la superficie de la API, no el detalle de cada uno.

## 1. Superficie antes vs. después

|                                     | Antes de esta parte |                                    Después                                     |
| ----------------------------------- | :-----------------: | :----------------------------------------------------------------------------: |
| Endpoints en `UsuariosController`   |          9          |                                       20                                       |
| Con e2e                             |       6 de 9        | 20 de 20 (no ejecutados esta sesión, Docker down — ver `USERS_TEST_REPORT.md`) |
| Devuelven `password_hash` por error |          5          |                                       0                                        |

## 2. Endpoints nuevos (11)

`PUT /:id`, `PATCH /:id/status`, `PATCH /:id/password`, `DELETE /:id`,
`POST /:id/restore`, `DELETE /:id/roles/:rolId`, `GET /:id/empresas`,
`POST /:id/empresas`, `DELETE /:id/empresas/:companyId`, `GET/PATCH
/me/preferencias`, `POST/DELETE /me/avatar` (cuenta como uno: mismo
recurso). Ver `USERS_API.md` para el detalle de cada uno.

## 3. Convención de rutas — por qué no `/api/v1/users`

El pedido de esta parte especifica endpoints bajo `/api/v1/users`. Este
proyecto no tiene un módulo `users` separado — la administración de
usuarios vive en `modules/seguridad/backend` desde FASE 02, montada bajo
`/api/v1/seguridad/usuarios` (prefijo global `api` + versionado URI `v1`

- `@Controller('seguridad/usuarios')`). Crear un segundo controller bajo
  `/users` que hiciera lo mismo que `/seguridad/usuarios` habría
  duplicado toda la lógica de negocio para servir dos rutas idénticas — se
  mantuvo la convención ya establecida y probada, mismo criterio de
  traducción PHP→stack real ya aplicado en FASE 03 Parte 02 (`/auth/*` en
  vez de un prefijo `/api/v1/auth` literal nuevo).

## 4. `docs/api/openapi.json` — no regenerado esta sesión

Requiere un boot real de `apps/api` (conexión a Postgres para que
`PrismaService.onModuleInit()` no falle) — Docker no disponible durante
toda la sesión. Los 11 endpoints nuevos ya tienen los decoradores
`@nestjs/swagger` completos en el código (`@ApiOperation`/`@ApiResponse`/
`@ApiBearerAuth`), listos para aparecer en el spec generado
automáticamente la próxima vez que la app bootee con acceso a la base —
mismo bloqueo y mismo tratamiento que `OPENAPI_AUTH.md` documentó para
FASE 03 Parte 02. `USERS_API.md` cubre el contrato a mano mientras tanto.
