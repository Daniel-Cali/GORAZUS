# GORAZUS — Security Baseline

Estado de seguridad verificado, sin valores secretos. Ver `docs/database/SECURITY.md` y
`docs/database/06-estrategia-seguridad.md` para el diseño completo (documentación técnica
oficial, no duplicada acá); este archivo es el resumen operativo de "qué está verificado hoy".

## Secretos

- Todos los secretos (passwords, JWT, API keys de MinIO/RabbitMQ/PostgreSQL, secretos de Ollama)
  viven exclusivamente en `.env`, no trackeado por git (confirmado ignorado).
- `backups/` y `docker-data/` están fuera de control de versiones.
- `node_modules/` ignorado en todo el monorepo.
- Ninguna documentación (incluida esta) contiene valores reales — solo nombres de variables.

## Roles PostgreSQL — Least Privilege

Verificado directamente contra `pg_roles`/`information_schema` el 2026-08-13 (ver
`docs/FASE_6_POSTGRES_ROLES_REPORT.md` para la evidencia completa):

| Rol                    | SUPERUSER | CREATEROLE | CREATEDB | BYPASSRLS | Justificación del bypass                                                  |
| ---------------------- | --------- | ---------- | -------- | --------- | ------------------------------------------------------------------------- |
| `gorazus_app`          | No        | No         | No       | No        | — (rol de aplicación, RLS aplica siempre)                                 |
| `gorazus_backup`       | No        | No         | No       | Sí        | `pg_dump` necesita ver todos los tenants                                  |
| `gorazus_migrator`     | No        | No         | No       | Sí        | Migraciones administrativas cross-tenant                                  |
| `gorazus_readonly`     | No        | No         | No       | No        | — (verificado: 0 grants de INSERT/UPDATE/DELETE/TRUNCATE en toda la base) |
| `gorazus_audit_writer` | No        | No         | No       | No        | — (NOLOGIN, solo 3 grants de INSERT en tablas de auditoría)               |

- `gorazus_migrator`/`gorazus_readonly` **sin LOGIN/contraseña** hasta autorización explícita del
  usuario — no es una brecha, es el estado intencional (ver `docs/DO_NOT_TOUCH.md`).

## Row-Level Security

- `FORCE ROW LEVEL SECURITY` activo en las tablas reales de los 21 schemas de negocio, excluyendo
  explícitamente `core.restore_test_logs` (documentado como intencional).
- `gorazus_app` confirmado `NOSUPERUSER NOBYPASSRLS` — sin esto, RLS sería un no-op para el rol
  que usa la API (bug histórico ya corregido, ver Decision Log del AKB, entrada 2026-08-03).
- Políticas activas verificadas: `tenant_isolation`, `company_isolation`, `branch_isolation` (las
  dos últimas RESTRICTIVE, no permisivas — ver Decision Log del AKB para el historial completo de
  esta corrección, incluidas las tablas de bootstrap excluidas a propósito en `core`/`security`).
- Issues de seguridad abiertos relacionados con RLS: `ISSUE-23` (resuelto), `ISSUE-24`
  (`UsuarioAdminRepositoryPrisma` sin `withTenantScope`, abierto a propósito — ver
  `docs/AKB/00 Governance/Issue Register.md`).

## Autenticación / Sesiones (track de negocio, no tocado en Fase 6/7 de infraestructura)

Ver `docs/architecture/13-modulo-auth.md` y `AUTH_ARCHITECTURE.md` (`docs/reports/auth/`) para el
diseño completo — 2FA, bloqueo por intentos, rotación de refresh token, protección de
session-hijacking, CSRF. No se modificó nada de esto en esta sincronización de documentación.

## No secrets in documentation — checklist de esta sincronización

- [x] Ningún archivo creado/modificado en `.claude/`, `docs/` o `docs/AKB/` contiene un valor de
      `.env`.
- [x] `.env` no fue leído con un comando que expusiera su contenido completo en pantalla — solo
      se verificó presencia/ausencia de nombres de variable específicos, cuando fue necesario en
      la sesión de Fase 6.
- [x] Ningún comando de esta sesión imprimió una contraseña, token o connection string completa.
