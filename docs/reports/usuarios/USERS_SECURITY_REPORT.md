# Users Security Report — FASE 03, Parte 03

> Entregable de esta parte (Gestión de Usuarios Enterprise). Ver
> `SECURITY_REPORT.md` para el estado de seguridad consolidado del
> proyecto completo (actualizado también esta sesión).

## 1. Hallazgo principal: fuga de `password_hash` — corregido

**Severidad: alta.** Antes de esta parte, `modules/seguridad/backend`
devolvía la fila cruda de `core.users` (tipo Prisma `users`) en cada
respuesta que incluyera un usuario:

- `GET /seguridad/usuarios/me`
- `PATCH /seguridad/usuarios/me`
- `POST /seguridad/usuarios` (crear)
- `POST /seguridad/usuarios/:id/activar` / `:id/desactivar`
- `GET /seguridad/usuarios` (listar — el más grave, filtraba el hash de
  **todos** los usuarios del tenant en una sola respuesta)

`password_hash` es un hash Argon2id, no la contraseña en texto plano —
pero filtrarlo igual habilita un ataque de cracking offline sin límite
de intentos ni rate limiting (a diferencia de intentar loguearse, que sí
tiene bloqueo por intentos desde FASE 2). Argon2id es deliberadamente
costoso de calcular, lo que mitiga pero no elimina el riesgo frente a un
atacante con suficiente cómputo, y de todas formas viola directamente el
principio de "nunca exponer secretos innecesariamente" — no había
ninguna razón funcional para que el cliente recibiera ese campo.

**Corrección**: `toUsuarioPublico()` (`modules/seguridad/backend/services/usuario-publico.mapper.ts`)
— `Omit<users, 'password_hash'>` — aplicado en el `UsuariosAdminService`
a **toda** ruta de salida (`crear`, `listar`, `obtenerPerfil`,
`actualizarPerfil`, `editar`, `cambiarEstado`, `eliminar`, `restaurar`,
`resetearPassword`). Verificado con tests unitarios explícitos
(`usuarios-admin.service.spec.ts`: "crear: nunca devuelve password_hash",
"listar: ningún usuario devuelto incluye password_hash") y una aserción
e2e (`usuarios.controller.e2e-spec.ts`).

## 2. Permisos — sin cambios de criterio, extendido consistentemente

Todo endpoint administrativo nuevo (`PUT /:id`, `PATCH /:id/status`,
`PATCH /:id/password`, `DELETE /:id`, `POST /:id/restore`, `DELETE
/:id/roles/:rolId`, multiempresa) exige el mismo permiso ya establecido
`seguridad.gestionar_usuarios` (`RequirePermission`, `PermissionsGuard`
fail-closed global) — ningún endpoint nuevo quedó sin gate. Los
endpoints self-service (`/me`, `/me/password`, `/me/preferencias`,
`/me/avatar`) siguen operando exclusivamente sobre `context.userId` del
JWT — nunca un `:id` de otro usuario tomado del body/query, así que no
hay superficie para que un usuario autenticado edite a otro por esa vía.

## 3. Estado agregado — por qué no rompe el enforcement existente

`PATCH /:id/status` guarda estados finos (`suspended`/`blocked`/
`pending_activation`) en `metadata.status`, pero **siempre** en conjunto
con `is_active=false` en la misma escritura — nunca como la única señal.
Cualquier código existente que ya decide autenticación/autorización en
base a `is_active` (hoy, ese chequeo vive en `Usuario.puedeAutenticarse()`
en `modules/auth/backend`, sin cambios en esta parte) sigue funcionando
exactamente igual sin que `auth` necesite enterarse de la distinción
fina — evita el riesgo de una escalada por desincronización entre dos
módulos que ahora tendrían que estar de acuerdo sobre el significado de
un nuevo enum.

## 4. Multiempresa — validaciones aplicadas

`EmpresasUsuarioService.asignar()` rechaza (antes de tocar la base):
empresa inactiva (`EmpresaInactivaException`, 409), empresa ya asignada
(`EmpresaYaAsignadaException`, 409), usuario inexistente
(`UsuarioNoEncontradoException`, 404) — evita asignar contra una empresa
dada de baja o duplicar la relación. `desasignar()` confirma que la
asignación exista antes de intentar revocarla (`AsignacionNoEncontradaException`, 404) — mismo criterio "sin enumeración silenciosa" que el resto del
proyecto, aunque acá sí confirma existencia porque el actor ya tiene el
permiso administrativo (`gestionar_usuarios`), a diferencia de, por
ejemplo, `POST /auth/revoke` (autoservicio, ahí sí importa no confirmar
sesiones ajenas).

## 5. Avatar — límites aplicados

Tamaño máximo 5MB, verificado **antes** de llamar a `StorageService`
(`ArchivoDemasiadoGrandeException`, 400) — evita subir archivos grandes
innecesariamente a MinIO antes de rechazarlos. Nombre de archivo
saneado (mismo saneamiento que `core/storage/storage.controller.ts`) —
colapsa `..`/`/` y caracteres fuera de alfanumérico antes de convertirlo
en object key. Bucket propio por tenant (`avatares-<tenantId>`, no
compartido con `archivos-<tenantId>` genérico) — mismo aislamiento
multi-tenant que el resto de `core/storage`. URLs de descarga siempre
firmadas de corta duración (~5 min, `getSignedUrl` heredado de
`StorageService`) — nunca credenciales de MinIO expuestas al cliente.

## 6. No evaluado esta sesión

- Pentesting real / escaneo activo contra los endpoints nuevos — Docker
  no disponible durante toda la sesión, ver `USERS_TEST_REPORT.md §3`.
- Rate limiting específico en `POST /seguridad/usuarios` (crear) o
  `PATCH /:id/password` (reset) — ambos ya están detrás del rate limit
  global (100/60s, `core/http`), sin un límite propio más estricto como
  `/auth/login` — decisión de producto pendiente, no evaluada esta parte
  (el riesgo es menor: ambos requieren el permiso administrativo, no son
  endpoints públicos como el login).
