---
id: platform-security
title: Security
version: 1.0.0
status: active
owner: Enterprise Solution Architect
domain: platform
subdomain: security
created: 2026-07-27
updated: 2026-07-27
tags: [platform, security, rls]
related:
  - '[[Infrastructure]]'
  - '[[Issue Register]]'
---

# Purpose

Seguridad real de GORAZUS — verificada completa contra `docs/database/06-estrategia-seguridad.md` y
`docs/architecture/09-seguridad-y-multiempresa.md` en el cierre de gobernanza de [[ADR-INV-000]].

# Architecture

- **RBAC**: `Usuario→Rol(por empresa)→Permiso`, granularidad `<modulo>.<accion>`, dos guards
  separados (`JwtAuthGuard`/`PermissionsGuard`), cache en Redis.
- **Row Level Security**: real, a nivel de Postgres, en las **494 tablas sin excepción** —
  `tenant_isolation`/`company_isolation` como `CREATE POLICY` reales. Convierte "olvidar el filtro"
  de fuga de datos catastrófica a cero filas devueltas.
- **Cifrado**: en tránsito (`sslmode=verify-full`), en reposo por volumen, y en reposo por columna
  (`pgcrypto`) para PII/credenciales de alta sensibilidad.
- **Roles de BD de privilegio mínimo**: `gorazus_app` (sin `DROP`/`BYPASSRLS`), `gorazus_migrator`,
  `gorazus_readonly`, `gorazus_backup`, `gorazus_audit_writer` (solo `INSERT` en `audit_logs`).
- **Auditoría universal**: trigger automático, inmutable, sobre 494 tablas (`core.audit_logs`).

# Risks

**Brecha real, no resuelta (ISSUE-02)**: las políticas RLS reales cubren `tenant`/`company`,
**ninguna cubre `branch`/`warehouse`** — un usuario con permiso a nivel de empresa puede, en
principio, operar sobre almacenes de cualquier sucursal de esa empresa.

# Update — 2026-08-03 (corrección real, auditoría completa del proyecto)

**Corrección sobre esta misma nota**: la línea de arquitectura de arriba ("`tenant_isolation`/
`company_isolation` como `CREATE POLICY` reales") **era inexacta** — verificado leyendo el SQL
realmente aplicado (`30_backup_restore.sql`, `34_rls_hardening.sql`, `35_functional_completion.sql`,
`36_crm_customer_completion.sql`): solo `tenant_isolation` existía. `company_isolation` estaba
documentada en `docs/database/06-estrategia-seguridad.md §1` y parcialmente seteada por
`withTenantScope` (`app.current_company_ids`), pero ninguna política Postgres la leía — un
`set_config` sin política que lo consumiera. `branch_id` no tenía ningún mecanismo, ni documentado
ni aplicado. El "Risk" de arriba (ISSUE-02) estaba, si acaso, subestimado: la brecha real incluía
`company_id`, no solo `branch`/`warehouse`.

**Corregido** (no verificado contra Postgres real — Docker inactivo en el entorno donde se corrigió):
`company_isolation`/`branch_isolation` ahora existen como políticas **RESTRICTIVE** (no permisivas —
una permisiva se combina con OR entre tenants, abriría fuga cruzada) en 19 de 21 schemas
(`42_rls_company_branch_isolation.sql`), extendidas después a `core`/`security` excluyendo 5 tablas
de bootstrap (`core.tenants`, `core.users`, `core.login_attempts`, `core.sessions`,
`security.two_factor_credentials` — ya sea por contexto mínimo antes del login, o porque ya tenían
su propia excepción de bootstrap a nivel de tenant que una política nueva neutralizaría,
`43_rls_core_security_isolation.sql`). Limitación aceptada: esas 5 tablas pierden la capa de
`company_isolation`/`branch_isolation` incluso en sus usos ya autenticados — RLS es por tabla, no
por sitio de llamada. Ver [[Issue Register]] — `ISSUE-02` (parcialmente resuelto), `ISSUE-23`
(alcance `core`/`security`, cerrado por este cambio), `ISSUE-24` (hallazgo nuevo y separado:
`UsuarioAdminRepositoryPrisma` no usa `withTenantScope` en absoluto, ni siquiera para tenant — no
corregido en esta pasada).

# Related ADRs

[[ADR-INV-000]] §1.2, cierre de gobernanza · [[ADR-INV-002]] §2

# References

`docs/database/06-estrategia-seguridad.md` · `docs/architecture/09-seguridad-y-multiempresa.md` ·
[[Issue Register]] — ISSUE-02
