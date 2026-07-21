# Security — GORAZUS Database

> Generado 2026-07-17 (PHASE 01 — Database Enterprise). Verifica contra el estado
> real lo ya diseñado en `docs/database/06-estrategia-seguridad.md` (RLS, roles,
> cifrado) — no repite el diseño, confirma su aplicación real y documenta 1
> desviación encontrada. Ver también `docs/standards/SECURITY_GUIDELINES.md` para
> el alcance de seguridad a nivel de aplicación completa (no solo base de datos).

## 1. Row-Level Security — verificado

**500 de 501 tablas lógicas tienen RLS habilitado** (`relrowsecurity = true`).

**Hallazgo real:** `core.restore_test_logs` es la única excepción — RLS no está
habilitado. Contradice la afirmación de `06-estrategia-seguridad.md §1` ("RLS se
habilita en las 494 tablas sin excepción"). Evaluación: es plausiblemente
intencional (una tabla de registro de pruebas de restauración de backup es
infraestructura operativa, no dato de negocio de un tenant específico — ver
`docs/database/08-estrategia-respaldo.md`), pero no está documentado como excepción
explícita en ningún lugar. **No se modifica en esta fase** (agregar RLS a una tabla
sin confirmar si algún proceso de backup ya la usa sin contexto de tenant sería un
cambio de comportamiento, no una optimización segura) — se deja como decisión
pendiente de confirmación explícita.

## 2. Roles de base de datos — verificados, existen los 5 documentados

| Rol                    | Existe | Uso documentado                                   |
| ---------------------- | ------ | ------------------------------------------------- |
| `gorazus_app`          | ✅     | Conexión de `apps/api` en producción              |
| `gorazus_migrator`     | ✅     | Aplicación de `sql/*.sql` versionados             |
| `gorazus_readonly`     | ✅     | Réplicas de lectura, BI, reportes                 |
| `gorazus_backup`       | ✅     | Proceso de respaldo                               |
| `gorazus_audit_writer` | ✅     | Función/trigger de auditoría (`SECURITY DEFINER`) |

Los 5 roles ya fijados en `docs/database/06-estrategia-seguridad.md §2` existen
realmente en la instancia.

🔴 **Corrección crítica (2026-07-20, FASE 01 Database Enterprise — segunda pasada):**
la afirmación de arriba ("ninguno tiene BYPASSRLS ni superusuario, verificado") era
**incorrecta** — re-verificado con `SELECT rolname, rolsuper, rolbypassrls FROM
pg_roles WHERE rolname LIKE 'gorazus%'` contra la instancia real:

| Rol                    | `rolsuper`  | `rolbypassrls` | ¿Por qué?                                                                                                             |
| ---------------------- | ----------- | -------------- | --------------------------------------------------------------------------------------------------------------------- |
| `gorazus_app`          | 🔴 **true** | 🔴 **true**    | Ver causa raíz abajo                                                                                                  |
| `gorazus_migrator`     | false       | true           | Intencional — `30_backup_restore.sql` línea 93 (`ALTER ROLE gorazus_migrator BYPASSRLS`, operaciones administrativas) |
| `gorazus_backup`       | false       | true           | Intencional — línea 94, mismo motivo (`pg_dump` necesita ver todo)                                                    |
| `gorazus_readonly`     | false       | false          | Correcto, sin excepción                                                                                               |
| `gorazus_audit_writer` | false       | false          | Correcto, sin excepción (`NOLOGIN`, solo usado vía `SECURITY DEFINER`)                                                |

**Causa raíz exacta de `gorazus_app` como superusuario** — no es un problema del
diseño SQL en sí, es una colisión de identidad con el bootstrap de la imagen oficial
`postgres`: `infra/docker/docker-compose.yml` define
`POSTGRES_USER: ${POSTGRES_USER:-gorazus_app}` — la imagen oficial de Postgres
**siempre** crea ese usuario como superusuario en el primer arranque del contenedor
(`initdb`). Como el nombre elegido para ese bootstrap coincide con el nombre que
`30_backup_restore.sql` línea 21-23 intenta crear como rol limitado
(`CREATE ROLE gorazus_app LOGIN PASSWORD NULL`, guardado por `IF NOT EXISTS`), el
`CREATE ROLE` no hace nada — el rol ya existe, con superusuario heredado del
bootstrap, y los `GRANT` posteriores (línea 45-50) son verdaderamente irrelevantes:
un superusuario ya tiene acceso total a todo, con o sin esos GRANT. `apps/api` se
conecta con este mismo rol vía `DATABASE_URL` — **esto es lo que hace que RLS no
proteja nada del tráfico real de la API hoy** (`FORCE ROW LEVEL SECURITY` tampoco
alcanzaría a corregirlo: Postgres exime a un superusuario de RLS
incondicionalmente, con o sin `FORCE`).

**No corregido en esta fase** (fuera de alcance: "solo base de datos, no tocar
backend" — cambiar `DATABASE_URL` es una decisión de backend/infra que necesita su
propia sesión). **Recomendación concreta para cuando se aborde:**

1. Renombrar el `POSTGRES_USER` de bootstrap a algo que **no** colisione con ningún
   rol de aplicación (p. ej. `gorazus_superuser` o simplemente `postgres`).
2. Dejar que `30_backup_restore.sql` cree `gorazus_app` limpio, sin superusuario ni
   `BYPASSRLS` — heredará únicamente los `GRANT` ya escritos ahí (que ya son
   correctos y suficientes).
3. Aplicar `ALTER TABLE ... FORCE ROW LEVEL SECURITY` en las 501 tablas (necesario
   además del punto 2, porque `gorazus_app` seguiría siendo el _dueño_ de las
   tablas — Postgres exime al dueño de RLS salvo `FORCE`).
4. Actualizar `DATABASE_URL` en `.env`/`.env.example` para apuntar al `gorazus_app`
   ya corregido.
5. Re-probar el flujo completo de login/seguridad (`modules/auth/backend`,
   `modules/seguridad/backend`) contra el rol corregido — en particular,
   `modules/seguridad/backend/scripts/seed-rbac.ts` usa un `PrismaClient` crudo sin
   `set_config` de tenant; con RLS realmente forzado dejaría de ver las filas del
   tenant real (seguiría viendo las del tenant sentinela `00000000...` por la
   cláusula `OR` de la política) — necesita ajustarse para setear el contexto de
   tenant antes de tocar `core.users`/`core.user_roles`.

## 3. Cifrado — referencia, sin cambios en esta fase

Ya fijado completo en `docs/database/06-estrategia-seguridad.md §3` — `pgcrypto`
instalado y disponible (versión 1.3, verificado). No se auditó en esta fase si las
columnas sensibles (`customers.customer_bank_accounts`, etc.) ya están cifradas en
la instancia real, porque es una base de desarrollo sin datos sensibles reales
todavía — auditoría de cifrado real se hace cuando haya datos de producción.

## 4. Nueva superficie de seguridad de esta fase: imagen Docker

`infra/docker/postgres/Dockerfile` agrega `postgresql-17-partman` desde el
repositorio oficial `apt.postgresql.org` (PGDG) — mismo canal de confianza que el
resto del stack de Postgres (la imagen base `postgres:17` ya usa ese repositorio
para el propio motor). No se agregó ningún paquete de un origen no verificado.

## 5. Trazabilidad

| Punto pedido en la fase               | Cerrado en                                                                                                                                                                                                                                                              |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Revisar seguridad de la base de datos | §1-3                                                                                                                                                                                                                                                                    |
| Detectar problemas                    | §1 — 1 tabla sin RLS, documentada, no corregida sin confirmación; §2 — `gorazus_app` superusuario/BYPASSRLS por colisión de bootstrap Docker, causa raíz exacta documentada, corrección recomendada pero no aplicada (fuera de alcance de un pase "solo base de datos") |
