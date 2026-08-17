# FASE 6 — Recreación y validación de roles de aplicación PostgreSQL

**Fecha:** 2026-08-13
**Alcance:** Recrear de forma segura los 5 roles PostgreSQL de aplicación que la migración
Fase 1 (traslado de storage de C:\ a D:\) no pudo preservar, porque `pg_dump`/`pg_restore`
nunca incluyen roles a nivel de clúster — solo el contenido de la base de datos.

## Contexto: incidente de entorno durante esta fase

Antes de poder tocar cualquier rol, Docker Desktop y Git for Windows desaparecieron del
sistema de forma no explicada (sin registro de desinstalación MSI, con entradas de registro
huérfanas apuntando a ejecutables inexistentes en `C:\Program Files`). Con autorización
explícita del usuario, ambos se reinstalaron *_en D:\*_ (`D:\Docker\Docker` +
`D:\Docker\wsl-data` para el WSL2 data root de Docker, `D:\Git`), preservando la regla del
proyecto de no escribir deliberadamente en C:\. El dato real de Postgres
(`D:\15_Codigo_Fuente\GORAZUS\docker-data\postgres`, bind mount NTFS desde la Fase 1)
sobrevivió intacto porque nunca dependió del storage interno de Docker/WSL2 — validación
retroactiva de esa decisión de arquitectura.

## Resultado

**FASE 6 — PASSED WITH KNOWN ISSUES**

## Roles

| Rol                    | Existía antes | Creado en esta fase | LOGIN        | SUPERUSER | Propósito                                                            | Estado                                                                                         |
| ---------------------- | ------------- | ------------------- | ------------ | --------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `gorazus_app`          | No            | Sí                  | Sí           | No        | Rol de aplicación/API (Prisma). Sin bypass de RLS.                   | Operativo — contraseña real aplicada desde `.env`                                              |
| `gorazus_backup`       | No            | Sí                  | Sí           | No        | Usado por el contenedor `backup` (pg_dump). BYPASSRLS + REPLICATION. | Operativo — contraseña real aplicada, backup automático probado con éxito                      |
| `gorazus_migrator`     | No            | Sí                  | Sí           | No        | Uso previsto para scripts de migración administrativa. BYPASSRLS.    | Creado, **sin contraseña** (ver Problemas restantes)                                           |
| `gorazus_readonly`     | No            | Sí                  | Sí           | No        | Acceso de solo lectura.                                              | Creado, **sin contraseña** (ver Problemas restantes); verificado como verdaderamente read-only |
| `gorazus_audit_writer` | No            | Sí                  | No (NOLOGIN) | No        | Solo INSERT en tablas de auditoría vía triggers.                     | Operativo (no requiere contraseña — NOLOGIN)                                                   |

Ningún rol recibió `SUPERUSER`, `CREATEROLE` ni `CREATEDB`. `gorazus_backup` y
`gorazus_migrator` tienen `BYPASSRLS` porque así lo documenta explícitamente
`docs/database/sql/30_backup_restore.sql` (líneas 116-118) — necesario para que el backup
lógico y las migraciones administrativas puedan operar across-tenant. Ningún otro rol tiene
bypass.

## Permisos

- Aplicados vía los archivos ya existentes y versionados `docs/database/sql/30_backup_restore.sql`
  y `docs/database/sql/34_rls_hardening.sql` — no se creó ni editó ningún archivo de migración
  nuevo.
- La sección de creación de roles + grants de `30_backup_restore.sql` se ejecutó con éxito.
- La sección de habilitación de RLS + política `tenant_isolation` de ese mismo archivo
  **falló al reintentarse** (`policy "tenant_isolation" for table "sales_routes" already
exists`) porque esa parte del script es un bootstrap de una sola vez, ya aplicado
  originalmente en la Fase 1 contra el clúster que ahora vive en D:\. Se verificó
  explícitamente que RLS y las políticas (`tenant_isolation`, `branch_isolation`,
  `company_isolation`) ya existían antes de continuar — no se perdió cobertura de RLS.
- Las dos líneas `ALTER ROLE gorazus_migrator/gorazus_backup BYPASSRLS` (las únicas partes de
  ese archivo que sí eran nuevas, porque los roles no existían) se aplicaron por separado,
  **con confirmación explícita del usuario** (la ejecución automática fue bloqueada por el
  clasificador de permisos del entorno por tratarse de una concesión de bypass de RLS).
- `34_rls_hardening.sql` se aplicó completo y se autoverificó: `NOTICE: 34_rls_hardening: OK
— gorazus_app sin superusuario/bypass, todas las tablas con RLS forzado.`
- `gorazus_readonly` confirmado sin ningún grant de INSERT/UPDATE/DELETE/TRUNCATE en toda la
  base (`information_schema.role_table_grants` — 0 filas) y sin acceso al schema `security`.
- `gorazus_audit_writer` confirmado con exactamente 3 grants de INSERT (`core.audit_logs`,
  `core.change_history`, `security.security_audit_logs`), nada más.

## Autenticación

- `.env` tiene credenciales reales solo para `POSTGRES_APP_PASSWORD` y
  `POSTGRES_BACKUP_PASSWORD`. **No existen** `POSTGRES_MIGRATOR_PASSWORD` ni
  `POSTGRES_READONLY_PASSWORD` en `.env` — no se inventó ninguna contraseña para
  `gorazus_migrator` ni `gorazus_readonly`, según la regla explícita de esta fase.
- Contraseñas aplicadas vía `ALTER ROLE ... WITH PASSWORD` para `gorazus_app` y
  `gorazus_backup`, leídas de `.env` y nunca impresas/logueadas.
- Login verificado exitosamente para ambos roles (`SELECT current_user` desde una sesión
  autenticada real).
- `gorazus_migrator` y `gorazus_readonly` existen pero **no pueden autenticarse todavía**
  (sin contraseña configurada) — ver Problemas restantes.

## Backup

- Backup de seguridad pre-cambios creado y auto-verificado antes de tocar ningún rol:
  `backups/gorazus_2026-08-13T152309998Z.dump` (6.78 MB, `pg_restore --list` OK).
- Servicio Docker `backup` (usa `gorazus_backup`) levantado y probado end-to-end: generó
  `gorazus_20260813T153810Z.dump` (6.8 MB) automáticamente al arrancar, con la contraseña
  real recién configurada. Retención de 7 días aplicada sin borrar respaldos históricos.

## Prisma

- `pnpm db:generate` ejecutado: **21/21 clientes Prisma generados correctamente**, 0 errores
  (nota: esto valida consistencia de schema, no requiere conexión viva a la base).
- No se ejecutó `pnpm db:pull` en ningún momento (prohibido explícitamente para esta fase).
- Conectividad real de `gorazus_app` contra datos de negocio verificada directamente
  (equivalente a lo que hace la API): login exitoso, `set_config('app.current_tenant_id',
...)` + `SELECT` sobre `core.tenants` y `core.users` devolvió resultados correctos y
  filtrados por RLS (el tenant sentinela `00000000-0000-0000-0000-000000000000` + el tenant
  de prueba, exactamente el comportamiento esperado documentado en
  `docs/database/06-estrategia-seguridad.md §1`). Confirma que RLS forzado no rompe el
  acceso legítimo del rol de aplicación.
- El contenedor Docker `api` (modo dev, hot-reload) se intentó levantar para una prueba
  end-to-end adicional vía HTTP, pero su `pnpm install` de arranque quedó colgado sin
  progreso de CPU/I/O durante varios minutos (comportamiento de tooling, no relacionado con
  Postgres — ver Problemas restantes). Se detuvo el contenedor; la validación de
  conectividad quedó cubierta por la prueba directa de arriba.

## Datos y Estructura

Re-verificado después de todos los cambios de roles/RLS, sin regresión respecto al baseline
documentado:

| Métrica                 | Valor |
| ----------------------- | ----- |
| Schemas                 | 23    |
| Tablas                  | 736   |
| Foreign keys            | 5217  |
| Índices                 | 3260  |
| Triggers                | 1222  |
| Funciones               | 134   |
| Vistas                  | 11    |
| Vistas materializadas   | 4     |
| Índices inválidos       | 0     |
| Constraints sin validar | 0     |

## RLS

- `gorazus_app` confirmado sin `SUPERUSER`/`BYPASSRLS`.
- `FORCE ROW LEVEL SECURITY` confirmado activo en las tablas reales de los 21 schemas de
  negocio (excluye explícitamente `core.restore_test_logs`, documentado como intencional).
- Auto-verificación del propio script `34_rls_hardening.sql` pasó sin excepciones.

## Auditoría

- `gorazus_audit_writer` (NOLOGIN) confirmado limitado a INSERT en las 3 tablas de auditoría
  documentadas — no puede leer ni modificar ningún otro dato.

## Git

- Git for Windows reinstalado en `D:\Git` (con autorización explícita del usuario), porque
  había desaparecido del sistema junto con Docker en el mismo incidente no explicado.
- `git status` verificado: el repositorio está 56 commits adelante de `origin` con una
  cantidad considerable de cambios en staging/working tree — **todo preexistente a esta
  sesión**, ninguno introducido por el trabajo de Fase 6 (que solo operó vía `docker exec`
  contra Postgres y descargó instaladores a `D:\Installers`, fuera del árbol del repo).
- No se hizo ningún commit ni se tocó el estado de git — fuera del alcance de esta fase.

## Disco C:\

- Ninguna escritura deliberada a C:\ en esta fase. Docker Desktop y Git se reinstalaron
  íntegramente en D:\ (`D:\Docker\Docker`, `D:\Docker\wsl-data`, `D:\Git`,
  `D:\Installers`). Se eliminó una entrada de registro huérfana de una instalación anterior
  de Docker Desktop (metadata de Windows, no dato de GORAZUS) para poder reinstalar.

## Problemas restantes

**Bloqueantes:** Ninguno.

**Conocidos:**

- `gorazus_migrator` y `gorazus_readonly` no tienen contraseña configurada — `.env` no
  define `POSTGRES_MIGRATOR_PASSWORD` ni `POSTGRES_READONLY_PASSWORD`. Ambos roles existen
  con los atributos y permisos correctos (verificados), pero no pueden usarse hasta que se
  decida y configure una contraseña real. Requiere decisión del usuario/equipo — no se
  inventó ningún valor.
- El contenedor `api` en modo dev quedó colgado en `pnpm install --frozen-lockfile` durante
  el arranque: el proceso permaneció con 0% CPU y 0 progreso de I/O durante varios minutos
  (no era lentitud del bind mount — verificado con `ps aux`/`docker stats` mostrando el mismo
  tiempo de CPU sin avanzar). Comportamiento de tooling (pnpm/red) no relacionado con los
  roles de Postgres de esta fase; fuera de alcance tocar Dockerfile/compose para
  diagnosticarlo más a fondo. Se detuvo el contenedor. La conectividad real de `gorazus_app`
  contra datos de negocio ya quedó demostrada de forma independiente y más directa (login +
  SELECT con RLS activo sobre `core.tenants`/`core.users`), por lo que esto no bloquea el
  resultado de esta fase.

**Deuda técnica:**

- Ninguna introducida en esta fase.

## Recomendación Fase 7

1. Decidir y provisionar contraseñas reales para `gorazus_migrator` y `gorazus_readonly`
   (vault/KMS o `.env`, según el estándar del proyecto), luego aplicarlas del mismo modo
   (`ALTER ROLE ... WITH PASSWORD`, nunca inventadas ni impresas).
2. Confirmar el arranque completo end-to-end del contenedor `api` en modo dev (más tiempo de
   espera o investigar la lentitud del bind mount) para cerrar la validación HTTP de
   `/health/live` contra el stack completo.
3. Considerar documentar en `infra/docker/README.md` el incidente de desaparición de
   Docker/Git como referencia si vuelve a ocurrir.

---

**FASE 6 — PASSED WITH KNOWN ISSUES**
