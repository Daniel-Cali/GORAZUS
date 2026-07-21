# 23 — Seguridad

**Ícono sugerido:** `shield`
**Tipo:** Dueño de datos
**Descripción:** Roles, permisos y políticas de acceso. Responde "qué
puede hacer" cada usuario autenticado — la autenticación en sí (login,
tokens) la resuelve `auth`, que no tiene menú propio (ver
[00-convenciones.md](./00-convenciones.md#6-relación-con-docsarchitecture)).
**Módulos relacionados:** todos los módulos consultan `seguridad` para
autorizar cada acción (ver
[09-seguridad-y-multiempresa.md](../architecture/09-seguridad-y-multiempresa.md)).

## Submenú: Usuarios

### Formularios

| Formulario                   | Qué hace                                                             | Tablas principales          | Permiso                | Documento que genera |
| ---------------------------- | -------------------------------------------------------------------- | --------------------------- | ---------------------- | -------------------- |
| Usuario                      | Alta/edición de usuario del sistema, vínculo con empleado (opcional) | `seguridad.usuario`         | `seguridad.crear`      | —                    |
| Empresas Asignadas a Usuario | Define a qué empresas puede acceder un usuario (multiempresa)        | `seguridad.usuario_empresa` | `seguridad.configurar` | —                    |

### Acciones

| Acción                       | Qué hace                                      | Permiso            | Efecto/Evento                                                                    |
| ---------------------------- | --------------------------------------------- | ------------------ | -------------------------------------------------------------------------------- |
| Bloquear/Desbloquear Usuario | Impide el login sin eliminar el registro      | `seguridad.editar` | Publica `UsuarioBloqueado`, consumido por `auth` para invalidar sesiones activas |
| Forzar Cierre de Sesión      | Revoca todas las sesiones activas del usuario | `seguridad.editar` | Llamada a `auth`                                                                 |
| Restablecer Contraseña       | Genera token de restablecimiento              | `seguridad.editar` | —                                                                                |

## Submenú: Roles y Permisos

### Formularios

| Formulario                   | Qué hace                                                     | Tablas principales      | Permiso                | Documento que genera |
| ---------------------------- | ------------------------------------------------------------ | ----------------------- | ---------------------- | -------------------- |
| Rol                          | Define un rol (nombre, descripción, empresa a la que aplica) | `seguridad.rol`         | `seguridad.crear`      | —                    |
| Asignación de Permisos a Rol | Marca qué permisos `<modulo>.<accion>` incluye un rol        | `seguridad.rol_permiso` | `seguridad.configurar` | —                    |
| Asignación de Rol a Usuario  | Vincula usuarios con uno o más roles                         | `seguridad.usuario_rol` | `seguridad.configurar` | —                    |

## Submenú: Auditoría de Accesos

| Elemento                                 | Detalle                                                       |
| ---------------------------------------- | ------------------------------------------------------------- |
| Consulta — Sesiones Activas              | Qué muestra: usuarios actualmente logueados, desde dónde      | Permiso: `seguridad.ver` |
| Reporte — Historial de Inicios de Sesión | Login exitosos/fallidos por usuario y fecha                   | Usuario, período         |
| Reporte — Cambios de Permisos            | Auditoría de quién otorgó/quitó qué permiso a qué rol/usuario | Período                  |

## Submenú: Reportes de Seguridad

| Reporte                         | Qué muestra                                                  | Filtros principales |
| ------------------------------- | ------------------------------------------------------------ | ------------------- |
| Matriz de Permisos por Rol      | Qué puede hacer cada rol, en todos los módulos               | Rol                 |
| Usuarios por Rol                | Listado de usuarios agrupados por rol asignado               | Rol                 |
| Usuarios sin Actividad Reciente | Usuarios sin login en N días (candidatos a revisar/bloquear) | Rango de días       |

## Submenú: Consultas

| Consulta                         | Qué muestra                                                           | Permiso         |
| -------------------------------- | --------------------------------------------------------------------- | --------------- |
| Buscar usuario                   | Búsqueda libre por nombre, correo                                     | `seguridad.ver` |
| Permisos efectivos de un usuario | Todos los permisos que tiene un usuario, considerando todos sus roles | `seguridad.ver` |

## Configuraciones del módulo

| Parámetro                      | Qué controla                                                                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Política de contraseña         | Longitud mínima, complejidad, expiración                                                                                                          |
| Duración de sesión / token     | Vida del access token y refresh token (ver [09-seguridad-y-multiempresa.md](../architecture/09-seguridad-y-multiempresa.md#1-autenticación-auth)) |
| Bloqueo por intentos fallidos  | Cantidad de intentos antes de bloquear temporalmente                                                                                              |
| Roles predefinidos del sistema | Roles base que vienen de fábrica (Administrador, Vendedor, Cajero, etc.) — editables pero no eliminables                                          |
