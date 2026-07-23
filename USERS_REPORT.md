# Users Report — FASE 03, Parte 03 "Gestión de Usuarios Enterprise"

> Sesión del 2026-07-22, versión **0.5.0**. Módulo de negocio: no existe
> un módulo `users` separado en este proyecto — la administración de
> usuarios (alta/baja/roles/perfil) vive en `modules/seguridad/backend`
> desde FASE 02 (`auth` autentica, `seguridad` administra, ver
> `docs/architecture/15-modulo-security.md §1` y `AUTH_README.md §5`). El
> pedido de esta parte pide endpoints bajo `/api/v1/users`; se mantiene
> la convención ya establecida (`/api/v1/seguridad/usuarios`) en vez de
> crear un segundo prefijo para lo mismo. Ver `USERS_TEST_REPORT.md` para
> testing, `USERS_API.md`/`USERS_API_REPORT.md` para el contrato de cada
> endpoint, `USERS_SECURITY_REPORT.md` para el hallazgo principal.

## 1. Punto de partida — qué ya existía antes de esta parte

`modules/seguridad/backend` ya tenía: `GET/PATCH /usuarios/me`, `PATCH
/usuarios/me/password`, `GET /usuarios` (listar), `POST /usuarios`
(crear con contraseña temporal), `activar`/`desactivar`,
`GET :id/historial` (auditoría), `POST :id/roles` (asignar rol) —
construido en FASE 02. Auditado al inicio de esta parte antes de escribir
código (mismo criterio que las partes anteriores de FASE 03): confirmado
que **todo eso devolvía la fila cruda de `core.users`, incluido
`password_hash`, en cada respuesta** — ver `USERS_SECURITY_REPORT.md §1`.

## 2. Hallazgo de seguridad corregido primero

`password_hash` (Argon2id) se filtraba en `GET /me`, `PATCH /me`, `POST /`
(crear), `activar`/`desactivar`, y `GET /` (listar) — la respuesta
serializaba el objeto `users` de Prisma tal cual. Corregido con
`toUsuarioPublico()` (`services/usuario-publico.mapper.ts`), aplicado a
**toda** respuesta que incluya un usuario, sin excepción. No era texto
plano, pero un hash filtrado habilita cracking offline igual — mismo
espíritu que "Evitar exposición de datos sensibles" pedido explícitamente
en esta parte.

## 3. Qué se agregó — funcionalidad real

- **Edición administrativa** (`PUT /seguridad/usuarios/:id`): nombre y/o
  correo de cualquier usuario del tenant (antes solo existía autoedición
  del propio nombre).
- **Cambio de correo** — self-service (`PATCH /me`, ahora acepta `email`
  opcional) y administrativo (`PUT /:id`), ambos con chequeo de
  unicidad por tenant.
- **Soft delete + restore** (`DELETE /:id`, `POST /:id/restore`) — antes
  no existía ningún mecanismo de eliminación, ni lógica ni física;
  `desactivar` solo tocaba `is_active`.
- **Estado agregado** (`PATCH /:id/status`) — `active`/`inactive`/
  `suspended`/`blocked`/`pending_activation`. `core.users` solo persiste
  `is_active` (booleano) + `deleted_at`, sin un enum de estado — los
  estados más finos se guardan en `metadata.status` (JSONB) SIEMPRE junto
  con `is_active=false`, nunca como única señal, así que cualquier
  chequeo existente que ya lee `is_active` sigue funcionando sin cambios
  (ver `USERS_SECURITY_REPORT.md §3` para el razonamiento completo de por
  qué se hizo así en vez de una migración). `activar`/`desactivar`
  (endpoints preexistentes) siguen andando, ahora como atajos del mismo
  mecanismo.
- **Reseteo de contraseña administrativo** (`PATCH /:id/password`) —
  genera y devuelve una temporal, sin exigir la anterior (a diferencia
  del `PATCH /me/password` self-service, que sí la exige).
- **Revocar rol** (`DELETE /:id/roles/:rolId`) — el método de servicio
  (`revocarRol`) ya existía desde FASE 02 pero no tenía ruta que lo
  expusiera (código muerto). Ahora es alcanzable.
- **Multiempresa** (`GET/POST/DELETE /:id/empresas`) — wirea
  `core.user_companies`, tabla que existía en el modelo certificado
  Enterprise v1.0.0 desde su creación sin un solo consumidor de
  aplicación. Es la lista de pertenencia ("a qué empresas puede acceder
  este usuario"), **no** reemplaza la empresa activa de la sesión (eso
  lo sigue fijando `auth` al emitir el token — sin cambios acá).
- **Preferencias** (`GET/PATCH /me/preferencias`) — wirea
  `core.user_profiles` (1:1 con `users`, también sin consumidor hasta
  ahora). `idioma`/`zonaHoraria` van a columnas reales
  (`preferred_language`/`preferred_timezone`); tema/formatos de
  fecha-hora-número/página inicial/registros por página/notificaciones
  no tienen columna propia en el modelo congelado — van a
  `user_profiles.metadata` (JSONB), sin requerir migración.
- **Foto de perfil** (`POST/DELETE /me/avatar`) — reusa `StorageService`
  (`core/storage`, ya `@Global()`) con bucket propio
  (`avatares-<tenantId>`), guardando la key en
  `user_profiles.metadata.avatarKey` — **no** en la columna
  `user_profiles.avatar_file_id` (esa es FK a `core.files`, tabla que
  ningún flujo de subida existente llena; ver §5).

## 4. Deliberadamente NO implementado

- **Cambio de nombre de usuario** — mismo gap ya documentado en FASE 03
  Parte 02 (`AUTH_REPORT.md §4`): `core.users` no tiene columna
  `username`, y el modelo de datos está congelado
  (`Enterprise v1.0.0`). No se rellena con una columna apurada.
- **Múltiples almacenes por usuario** — `core.warehouses` existe en el
  schema (`inventory` — 501 tablas certificadas ya cubren Almacenes a
  nivel de modelo), pero **no existe ninguna tabla de unión
  `user_warehouses`**, y `modules/inventario` (el módulo de negocio que
  administraría esos almacenes) sigue completamente vacío
  (`TECHNICAL_DEBT.md §3`, `ROADMAP.md`). Asignar almacenes a un usuario
  antes de que existan almacenes administrables sería trabajo
  especulativo — se documenta el gap, no se inventa una tabla nueva ni
  se asigna contra un almacén que no se puede crear/listar todavía.
- **Múltiples sucursales por usuario** — mismo motivo que almacenes: no
  existe `user_branches` en el modelo (solo `user_companies`, a nivel
  empresa). `core.users.branch_id` sigue siendo la única sucursal (fija,
  no una lista) — igual que antes de esta parte.
- **Firma digital** — el pedido dice explícitamente "(preparada)", no
  "implementada". `user_profiles.metadata` queda como el lugar reservado
  (`metadata.signatureKey`, mismo mecanismo que `avatarKey`) para cuando
  haya un caso de uso real que la necesite (facturación electrónica,
  aprobaciones) — sin endpoint ni UI todavía, a propósito.
- **Flujo de invitación por email** — `crear`/`resetearPassword` siguen
  generando una contraseña temporal devuelta en la respuesta (Fase 1,
  documentado desde FASE 02 en el propio código). El diseño completo con
  token de invitación (`docs/architecture/15-modulo-security.md §1`)
  sigue sin implementar — no era parte del pedido explícito de esta
  parte (que sí pedía "pendiente de activación" como ESTADO, ahora
  soportado vía `metadata.status`, pero no el flujo de invitación en sí).

## 5. Decisión de diseño: `avatar_file_id` vs. `metadata.avatarKey`

`core.user_profiles.avatar_file_id` es una FK real a `core.files.id`.
`core/storage` (`POST /files`, FASE 2) nunca escribe una fila en
`core.files` — devuelve una key de MinIO directamente, documentado en su
propio código como el patrón esperado: "ningún módulo de negocio asocia
todavía estos archivos a sus propios registros... eso vive en la columna
`metadata JSONB` que ya tiene cada entidad". Extender `core/storage` para
que además cree una fila en `core.files` (y así poder poblar
`avatar_file_id` correctamente) es un cambio de infraestructura
compartida fuera del alcance de un módulo de negocio — se siguió el
patrón ya documentado (`metadata.avatarKey`) en vez de forzar la columna
FK con datos que no la satisfacen realmente.

## 6. Explícitamente fuera de alcance esta parte

- **Frontend**: sin cambios — el pedido de entregables de esta parte es
  enteramente backend (reportes + API), mismo criterio que Parte 02.
- **Entidad de dominio `Usuario` en `seguridad`**: el módulo ya operaba
  directamente sobre el tipo `users` de Prisma sin una clase de entidad
  (a diferencia de `auth`, que sí tiene `Usuario`/`Sesion`) — se mantuvo
  ese estilo existente en vez de introducir una entidad a mitad de
  módulo, por consistencia con el código ya construido.
- **Permiso más granular para multiempresa**: `asignar/desasignar
empresa` usa el mismo permiso `seguridad.gestionar_usuarios` que el
  resto del controller, en vez de uno nuevo — evita tocar
  `seed-rbac.ts`/reseed para una parte que no lo pidió explícitamente.

## 7. Versión

`0.4.0` → **`0.5.0`** (`MINOR`): funcionalidad real nueva (CRUD completo,
multiempresa, preferencias, avatar) más una corrección de seguridad real
(fuga de `password_hash`), no un cambio aditivo/preparatorio.
