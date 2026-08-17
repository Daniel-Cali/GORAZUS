# Users Test Report — FASE 03, Parte 03

> Entregable de esta parte (Gestión de Usuarios Enterprise). Cubre solo
> lo nuevo/modificado de esta sesión — para el inventario completo de
> toda la suite del backend ver `TEST_REPORT.md`.

## 1. Qué se agregó/modificó

| Archivo                                         | Tipo      | Motivo                                                                                                                                                                                                                                                                      |
| ----------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `services/usuario-publico.mapper.spec.ts`       | Nuevo     | `toUsuarioPublico()`/`resolverEstado()` son nuevos esta parte — cubre las 6 combinaciones de estado agregado y confirma que `password_hash` nunca sobrevive al mapeo                                                                                                        |
| `services/usuarios-admin.service.spec.ts`       | Nuevo     | `UsuariosAdminService` no tenía NINGÚN test unitario antes de esta parte (solo e2e indirecto) — 16 tests cubriendo crear/listar/editar/estado/eliminar/restaurar/password/roles, incluida la fuga de `password_hash` corregida y el nuevo guard `UsuarioEliminadoException` |
| `services/empresas-usuario.service.spec.ts`     | Nuevo     | `EmpresasUsuarioService` es nuevo esta parte (multiempresa)                                                                                                                                                                                                                 |
| `services/preferencias-usuario.service.spec.ts` | Nuevo     | `PreferenciasUsuarioService` es nuevo esta parte                                                                                                                                                                                                                            |
| `services/avatar-usuario.service.spec.ts`       | Nuevo     | `AvatarUsuarioService` es nuevo esta parte                                                                                                                                                                                                                                  |
| `controllers/usuarios.controller.e2e-spec.ts`   | Extendido | 5 tests preexistentes (perfil/password/activar-desactivar/historial) + 11 nuevos cubriendo cada endpoint agregado (antes, `crear`/`listar`/`asignarRol` ya existían en el controller pero SIN e2e — detectado en la auditoría de esta parte, ver `USERS_REPORT.md §1`)      |

Mismo patrón que el resto del proyecto: fakes mínimos del colaborador
exacto que la clase bajo prueba necesita, nunca un mock framework
genérico; los `*.usecase.spec.ts`/`*.service.spec.ts` no tocan
infraestructura real.

## 2. Cobertura de la lógica nueva — por caso

**`UsuariosAdminService`** (16 tests): `crear` nunca devuelve
`password_hash` + rechaza email duplicado; `listar` nunca devuelve
`password_hash` en ningún elemento; `obtenerPerfil` 404 en usuario
inexistente; `editar` (admin) actualiza nombre/email + rechaza email en
uso por otro usuario; `cambiarEstado` a cada valor del enum (verificado
`suspended`/`active`) confirma `is_active` + `metadata.status`
correctos; `eliminar` marca `deleted_at` sin borrar físicamente;
`restaurar` limpia `deleted_at` y reactiva, + 404 en usuario inexistente;
`cambiarPassword` rechaza contraseña actual incorrecta y acepta la
correcta (contra Argon2id real, sin mockear `verifyPassword`, mismo
criterio que `login.usecase.spec.ts`); `resetearPassword` (admin) genera
temporal sin verificar la anterior; `asignarRol`/`revocarRol` delegan
correctamente; **un usuario eliminado no puede editarse ni cambiar de
estado** (`UsuarioEliminadoException`) — este último caso lo encontró
esta misma sesión al escribir el test: `BaseRepository.findById()` no
filtra `deleted_at` (solo `findMany` lo hace), así que sin el guard
agregado esas operaciones seguirían funcionando en silencio sobre un
usuario ya eliminado.

**`EmpresasUsuarioService`** (6 tests): usuario inexistente, empresa
inactiva, empresa ya asignada, asignación exitosa con `isDefault`,
desasignación de algo no asignado (404), desasignación exitosa.

**`PreferenciasUsuarioService`** (3 tests): defaults (`es`/`UTC`, resto
`null`) sin fila previa en `user_profiles`; `idioma`/`zonaHoraria` van a
columna, el resto a `metadata`; dos actualizaciones consecutivas no se
pisan entre sí (el segundo PATCH conserva lo que dejó el primero).

**`AvatarUsuarioService`** (5 tests): rechazo por tamaño (>5MB) antes de
tocar el storage; subida al bucket correcto (`avatares-<tenantId>`) con
la key guardada en `metadata`; borrado idempotente sin avatar previo;
borrado real con avatar previo; `obtenerUrl` sin avatar devuelve `null`.

## 3. Corrida real de esta sesión

`Docker Desktop` sin conectar (`failed to connect to the docker API`,
nivel host de Windows) durante toda la sesión — mismo síntoma
ininterrumpido desde el cierre de FASE 03 Parte 01 (confirmado con
`docker ps` al inicio, no resuelto en el transcurso).

```
seguridad-backend (unitarios + specs de entidad, --runInBand): 58/58 ✅
  Incluye los 38 tests nuevos/extendidos de esta parte (5 suites) +
  20 preexistentes (entidades de rol/permiso/2FA/sesión/auditoría,
  totp.spec.ts) sin cambios.

5 suites e2e fallaron con ECONNREFUSED/Can't reach database server
(roles, usuarios, auditoria, sesiones, dos-factores — los 5 controllers
del módulo) — consistente con Docker caído, no con una regresión: la
extensión de `usuarios.controller.e2e-spec.ts` (16 tests, 11 nuevos)
compila limpio (confirmado sin errores TS al correrlo, solo falla en el
`beforeAll` al intentar conectar a Postgres) — nunca llegó a ejecutarse
contra datos reales esta sesión.
```

Build (`nx run seguridad-backend:build`) y lint (`nx run
seguridad-backend:lint`) ✅ limpios. `nx run api:build` (type-checkea
`apps/api` + las 17 tareas de las que depende, incluidos `auth-backend`/
`configuracion-backend`) ✅ sin errores — confirma que los tipos nuevos
exportados desde `@gorazus/core-database` (`user_companies`,
`user_profiles`) y las nuevas dependencias de `seguridad-backend`
(`multer`, `@gorazus/core-storage`) no rompieron ningún otro consumidor.

## 4. Pendiente de re-confirmar cuando Docker esté arriba

Los 16 tests de `usuarios.controller.e2e-spec.ts` (5 preexistentes + 11
nuevos) necesitan Postgres/MinIO reales para correr — especialmente la
suite de avatar (sube un archivo real a MinIO vía `StorageModule`) y la
de multiempresa (usa una empresa real sembrada). Primera acción
recomendada la próxima vez que Docker esté disponible: `pnpm nx run
seguridad-backend:test -- --runInBand` completo, prestando atención
particular a los tests de `empresas`/`avatar` (los únicos que tocan
infraestructura además de Postgres — MinIO vía `core/storage`).
