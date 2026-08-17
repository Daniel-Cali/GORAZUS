# Users (Gestión de Usuarios) — Guía rápida

> FASE 03, Parte 03. Cómo trabajar con la parte de administración de
> usuarios de `modules/seguridad/backend` en el día a día. Para el
> resumen de qué se construyó ver [USERS_REPORT.md](./USERS_REPORT.md);
> para el contrato de cada endpoint,
> [USERS_API.md](./USERS_API.md).

## 1. No es un módulo aparte

No existe `modules/users/` en este proyecto. La gestión de usuarios vive
en `modules/seguridad/backend` — `seguridad` administra (alta, edición,
estado, roles, multiempresa, preferencias), `auth` autentica (login,
sesión, tokens). Ver `AUTH_README.md §5` para la separación completa.
Si buscás dónde agregar algo relacionado a "usuarios", primero confirmá
si es un problema de AUTENTICACIÓN (¿quién sos?, va en `auth`) o de
ADMINISTRACIÓN (¿qué datos tenés?, ¿qué podés hacer?, va acá).

## 2. Archivos que probablemente edites

| Tarea                                                | Archivo(s)                                                                                                                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CRUD de usuario (crear/editar/eliminar/restaurar)    | `services/usuarios-admin.service.ts` + `controllers/usuarios.controller.ts`                                                                             |
| Estado del usuario (activo/suspendido/bloqueado/...) | `services/usuarios-admin.service.ts` `cambiarEstado()` + `services/usuario-publico.mapper.ts` `resolverEstado()`                                        |
| Multiempresa                                         | `services/empresas-usuario.service.ts` + `repositories/empresa-usuario.repository.(ts\|prisma.ts)`                                                      |
| Preferencias                                         | `services/preferencias-usuario.service.ts` + `repositories/perfil-extendido.repository.(ts\|prisma.ts)`                                                 |
| Foto de perfil                                       | `services/avatar-usuario.service.ts` (reusa `@gorazus/core-storage`)                                                                                    |
| Roles de un usuario                                  | `services/usuarios-admin.service.ts` `asignarRol`/`revocarRol` (delega a `repositories/asignacion.repository.ts`, compartido con `roles.controller.ts`) |
| Agregar un campo nuevo al perfil                     | Ver §3 — probablemente `user_profiles.metadata`, no una columna nueva                                                                                   |

## 3. `core.users` está congelado — dónde va cada dato nuevo

El modelo de datos es **Enterprise v1.0.0**, certificado y congelado
(`VERSION.md`). Ningún campo de perfil nuevo debería traducirse en "agregar
una columna a `core.users`" sin una migración versionada deliberada.
Antes de eso, revisá si ya hay un lugar:

- **`core.users.metadata`** (JSONB) — libre, sin consumidor hasta ahora
  fuera de lo que agregó esta parte (`status`, ver `resolverEstado()`).
- **`core.user_profiles`** (1:1 con `users`, wireado esta parte) —
  `preferred_language`/`preferred_timezone` son columnas reales; todo lo
  demás (tema, formatos, avatar, firma) va en su propio `metadata`.
- **`core.user_companies`** (N:M con `companies`, wireado esta parte) —
  multiempresa. No hay `user_branches`/`user_warehouses` — ver
  `USERS_REPORT.md §4` para por qué no se inventaron.

Si de verdad hace falta una columna nueva (ej. `username`, pedido y
rechazado esta parte por esta misma razón), es una decisión de negocio +
una migración `sql/NN_*.sql`, no algo para resolver dentro de una parte
de desarrollo de funcionalidad.

## 4. Correr los tests

```bash
# Unitarios (fakes, sin infraestructura real) — rápido
pnpm nx test seguridad-backend --testPathPattern="usuario"

# Con infraestructura real (Postgres/MinIO vía Docker) — más lento
pnpm nx test seguridad-backend -- --runInBand
```

El test de avatar (`usuarios.controller.e2e-spec.ts`, "avatar: sube...")
necesita además MinIO arriba (`docker compose up minio`), no solo
Postgres — es el único e2e de este controller con esa dependencia extra.

## 5. Estado agregado — cómo leerlo/escribirlo

`GET`/`PATCH` de un usuario siempre devuelven un campo `status`
calculado (`active`/`inactive`/`suspended`/`blocked`/`pending_activation`/
`deleted`), nunca lo escribas directamente — usá `PATCH :id/status
{ status: "..." }`. Interally: `active` es `is_active=true`; cualquier
otro valor (salvo `deleted`) es `is_active=false` + `metadata.status`.
`deleted` es exclusivamente `deleted_at` (vía `DELETE`/`POST :id/restore`,
nunca vía `PATCH :id/status`).

## 6. Errores comunes

- **`USUARIO_ELIMINADO` (409) al editar/cambiar estado/resetear
  contraseña** — el `:id` corresponde a un usuario soft-deleted.
  Restauralo primero (`POST :id/restore`).
- **`EMPRESA_INACTIVA`/`EMPRESA_YA_ASIGNADA` (409) al asignar empresa** —
  la empresa está dada de baja, o ya estaba asignada a ese usuario. `GET
:id/empresas` para ver el estado actual antes de reintentar.
- **`ECONNREFUSED`/`Can't reach database server`** — Docker no está
  arriba (`docker ps` para confirmar). No es un bug del código.
