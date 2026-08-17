# Módulo Seguridad

> Roles Enterprise (2026-07-26): CRUD completo (crear/obtener/renombrar/
> eliminar) + scoping real de empresa/sucursal + consulta de permisos
> asignados, cerrando gaps sobre la base que ya existía (`docs/architecture/15-modulo-security.md`).

## Responsabilidad

Administración de identidad y acceso: usuarios (alta, avatar, preferencias,
empresas asociadas), roles y permisos (RBAC), sesiones, doble factor y
auditoría.

## Entidades que este módulo posee

- `core.roles`, `core.permissions`, `core.role_permissions`, `core.user_roles`
  (vía `RolRepository`/`PermisoRepository`/`AsignacionRepository`).
- `core.users` (vía `UsuarioAdminRepository`) + `security.two_factor_credentials`
  (vía `CredencialDosFactoresRepository`) + `core.sessions` (vía `SesionRepository`).

## Roles — scoping real

`core.roles.company_id`/`branch_id` son nullable en el schema desde antes
de esta fase — un rol puede ser de todo el tenant, de una empresa, o de
una sucursal. La API no lo exponía: `crear()` siempre fijaba la empresa
activa de la sesión y `listar()` no filtraba nada (la política RLS de
`core.roles` solo aísla por tenant, no por empresa). Cerrado en esta
fase: `POST /seguridad/roles` acepta `companyId`/`branchId` opcionales
(`companyId: null` explícito = rol de todo el tenant), `GET /seguridad/roles`
acepta `?companyId=`.

## Roles — CRUD completo

`GET /seguridad/roles/:id` (rol + códigos de permiso asignados),
`PATCH /seguridad/roles/:id` (renombrar), `DELETE /seguridad/roles/:id`
(baja lógica), `DELETE /seguridad/roles/:id/permisos/:code` (revocar) —
antes solo existían crear/listar/asignar. Un rol de fábrica
(`isSystemRole`) no puede renombrarse ni eliminarse — invariante que ya
existía en la entidad `Rol` pero nunca se llamaba desde ningún lado
(código muerto hasta esta fase); ahora se traduce a `409` vía
`RolDeFabricaException`.

## Roles — Domain Entities (`code`/`description`/`roleType`)

Pedido posterior ("Roles Enterprise - Domain Entities") pedía una entidad
`RoleContext` + un `RoleType` con valores `Organization`/`Department`/
`Project` — ninguno existe en GORAZUS (no hay esos niveles de scoping).
En su lugar: migración `39_roles_enterprise_fields.sql` agrega a
`core.roles` los campos `code` (identificador corto opcional, sin
unicidad forzada), `description` (texto libre) y `role_type` (CHECK
`system`/`tenant`/`company`/`branch`/`custom`, default `custom`,
backfill de los roles de fábrica existentes a `system`). Sin
`RoleContext` — el scoping real ya está resuelto por `company_id`/
`branch_id` (sección anterior). `POST /seguridad/roles` acepta los tres
campos; `roleType: 'system'` vía API devuelve `400` — un rol de fábrica
solo lo crea el script de seed.

## Roles — Domain Value Objects (descartados a propósito)

Pedido posterior ("Roles Enterprise - Domain Value Objects") pedía
`RoleId`/`RoleName`/`RoleCode` como clases separadas con igualdad de
valor propia — ningún otro entity del proyecto usa ese patrón (`Cliente`,
`Lead`, `Opportunity`, el propio `Rol`, todos validan primitivos directo
en el constructor). Las invariantes pedidas (largo máximo, normalización,
caracteres válidos) se incorporaron a `Rol` en vez de crear clases nuevas:
`name` se guarda recortado (máx. `NOMBRE_ROL_MAX_LENGTH` = 100), `code`
se guarda recortado y en mayúsculas (máx. `CODIGO_ROL_MAX_LENGTH` = 50,
solo letras/números/guion bajo). Reflejado también en `crearRolSchema`/
`actualizarRolSchema` (Zod) para que un valor inválido devuelva `400`
limpio en vez de llegar al `Error` de dominio sin traducir — mismo
hallazgo que `RolDeFabricaException`. `code`/`name` siguen siendo
`string`/`string | null` en repositorio, servicio y controlador — sin
tocar nada de lo construido en `v0.18.0`/`v0.19.0`.

## Roles — Eventos de dominio (preparados, sin publicar)

"GORAZUS ERP Enterprise Phase 03 Part 04, Subfase 4.1" pedía infraestructura
de Roles (module structure, entity, repositorios, DTOs, mappers, domain
events, exceptions, auditoría, tests, docs) — casi todo ya existía de las
3 fases anteriores (`v0.18.0`-`v0.20.0`). Lo único genuinamente nuevo:
`RolCreadoEvent`/`RolActualizadoEvent`/`RolEliminadoEvent`
(`modules/seguridad/backend/events/`), mismo patrón "preparado, sin
publicar todavía" que `modules/auth/backend/events/*.event.ts`
(`EventBusService` existe, ningún módulo lo usa para publicar todavía).
**"Mappers" no es un patrón que este proyecto use** — los servicios
devuelven el tipo de Prisma (`roles`) directo al controlador, sin una
capa de mapeo intermedia en ningún módulo — se omitió a propósito, no
por descuido.

## Permisos

`seguridad.gestionar_roles`, `seguridad.gestionar_usuarios`,
`seguridad.ver_auditoria`, `seguridad.gestionar_sesiones` — sembrados en
`modules/seguridad/backend/scripts/seed-rbac.ts`.

## Tests

`rol.entity.spec.ts` (invariantes de `roleType` + normalización de
nombre/código) + `roles.service.spec.ts` (19 tests) +
`roles.controller.e2e-spec.ts` (extendido: CRUD completo, scoping,
`code`/`description`/`roleType`, normalización, rechazo de rol de
fábrica y de código inválido). 46 tests totales de Roles.
`nx run seguridad-backend:test`.

## Hallazgo pre-existente, no de esta fase

Los e2e-spec de `usuarios`/`dos-factores`/`sesiones` (y `auditoria`,
verificar) no importan `StorageModule` en su `TestingModule` — el mismo
gap que tenía `roles.controller.e2e-spec.ts` antes de esta fase
(`AvatarUsuarioService` dentro de `SeguridadModule` inyecta
`StorageService`, `@Global()` pero sin import explícito el árbol de
testing queda incompleto). Se corrigió solo en `roles.controller.e2e-spec.ts`
por estar directamente en el alcance de esta fase — los otros tres quedan
documentados para una sesión futura, mismo criterio que el bug de
`@types/multer` en `configuracion-backend` (ver
`docs/reports/crm/CRM_PRODUCTION_READINESS_REPORT.md §2`).
