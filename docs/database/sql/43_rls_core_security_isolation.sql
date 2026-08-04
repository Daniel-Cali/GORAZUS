-- =============================================================================
-- GORAZUS ERP — 43_rls_core_security_isolation.sql
-- FASE 05 (Enterprise Release) — cierra `ISSUE-23` (docs/AKB/00 Governance/
-- Issue Register.md): extiende `company_isolation`/`branch_isolation`
-- (`42_rls_company_branch_isolation.sql`) a los schemas `core` y `security`,
-- deliberadamente excluidos de esa primera pasada.
--
-- Archivo nuevo — no edita ningún archivo ya existente, mantiene el
-- historial de migración append-only.
-- Depende de: 01_core.sql .. 42_rls_company_branch_isolation.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Exclusiones — 5 tablas, no las 3 originalmente identificadas.
--
-- Investigación adicional (no solo los 3 repositorios de `auth` con
-- contexto mínimo ya conocidos) encontró que DOS tablas más ya tienen su
-- propia excepción de bootstrap a nivel de TENANT en
-- `30_backup_restore.sql`, y aplicarles una política RESTRICTIVE de
-- empresa/sucursal las neutralizaría igual que si nunca hubieran
-- existido — el problema no es solo "el login no puede fijar
-- company_id todavía", es "ninguna política nueva puede exigir un
-- contexto que la propia excepción de tenant existe precisamente para
-- no requerir":
--
--   - `core.tenants`   — política `tenant_lookup_by_slug` (SELECT sin
--     `app.current_tenant_id`, resuelve el tenant ANTES de saber cuál
--     es). Estructuralmente tampoco tiene sentido aplicarle
--     company_isolation: una empresa pertenece a un tenant, nunca al
--     revés — `company_id` en esta tabla es un artefacto de la columna
--     de auditoría universal, sin significado real acá.
--   - `core.sessions`  — política `session_lookup_by_refresh_hash`
--     (SELECT por hash de refresh token, sin transacción ni
--     `withTenantScope` en absoluto — ver comentario real en
--     `modules/auth/backend/repositories/session.repository.prisma.ts`).
--     Sin excluirla, `app.current_company_ids` quedaría sin fijar en
--     ese SELECT puntual (no corre dentro de la transacción de
--     `withTenantScope` que lo fijaría) y la fila de sesión real —que
--     sí tiene `company_id` poblado desde el login— dejaría de ser
--     visible: el refresco de token se rompería.
--
-- Las 3 ya conocidas (contexto `{ tenantId, companyId: null }` explícito
-- en el propio código, antes de resolver el login):
--   - `core.users`                         (user.repository.prisma.ts)
--   - `core.login_attempts`                (login-attempt.repository.prisma.ts)
--   - `security.two_factor_credentials`    (two-factor-credential.repository.prisma.ts)
--
-- Limitación aceptada y documentada, no un descuido: estas 5 tablas
-- pierden la capa adicional de `company_isolation`/`branch_isolation`
-- incluso en sus usos YA autenticados (ej. `SessionRepositoryPrisma`
-- también las consulta con contexto completo en `revocar`/`listar`,
-- `core/http/guards`) — Postgres RLS es por tabla, no por sitio de
-- llamada; no se puede proteger el camino autenticado sin romper el de
-- bootstrap sobre la misma tabla. El filtrado por empresa/sucursal en
-- esos casos ya autenticados sigue dependiendo del código de aplicación,
-- exactamente como antes de este archivo.
--
-- Hallazgo relacionado, registrado por separado y NO corregido acá
-- (fuera de alcance, ver `ISSUE-24`): `UsuarioAdminRepositoryPrisma`
-- (`modules/seguridad/backend/repositories/usuario-admin.repository.prisma.ts`)
-- no usa `withTenantScope` en absoluto sobre `core.users` — un problema
-- de aislamiento de TENANT preexistente, independiente de este archivo.
-- -----------------------------------------------------------------------------

DO $$
DECLARE
    v_schema text;
    v_table text;
BEGIN
    FOR v_schema, v_table IN
        SELECT table_schema, table_name
        FROM information_schema.tables
        WHERE table_schema IN ('core', 'security')
        AND table_type = 'BASE TABLE'
        AND NOT (table_schema = 'core' AND table_name IN ('tenants', 'users', 'login_attempts', 'sessions'))
        AND NOT (table_schema = 'security' AND table_name = 'two_factor_credentials')
    LOOP
        EXECUTE format(
            'CREATE POLICY company_isolation ON %I.%I AS RESTRICTIVE USING (company_id IS NULL OR company_id = current_setting(''app.current_company_ids'', true)::uuid)',
            v_schema, v_table
        );
        EXECUTE format(
            'CREATE POLICY branch_isolation ON %I.%I AS RESTRICTIVE USING (branch_id IS NULL OR branch_id = current_setting(''app.current_branch_id'', true)::uuid)',
            v_schema, v_table
        );
    END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 2. Verificación — debe devolver 0 filas.
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    v_expected_tables int;
    v_company_policies int;
    v_branch_policies int;
BEGIN
    SELECT count(*) INTO v_expected_tables
    FROM information_schema.tables
    WHERE table_schema IN ('core', 'security')
    AND table_type = 'BASE TABLE'
    AND NOT (table_schema = 'core' AND table_name IN ('tenants', 'users', 'login_attempts', 'sessions'))
    AND NOT (table_schema = 'security' AND table_name = 'two_factor_credentials');

    SELECT count(*) INTO v_company_policies
    FROM pg_policies p
    JOIN information_schema.tables t ON t.table_schema = p.schemaname AND t.table_name = p.tablename
    WHERE p.policyname = 'company_isolation' AND p.schemaname IN ('core', 'security');

    SELECT count(*) INTO v_branch_policies
    FROM pg_policies p
    JOIN information_schema.tables t ON t.table_schema = p.schemaname AND t.table_name = p.tablename
    WHERE p.policyname = 'branch_isolation' AND p.schemaname IN ('core', 'security');

    IF v_company_policies <> v_expected_tables THEN
        RAISE EXCEPTION '43_rls_core_security_isolation: esperaba % políticas company_isolation en core/security, hay %', v_expected_tables, v_company_policies;
    END IF;
    IF v_branch_policies <> v_expected_tables THEN
        RAISE EXCEPTION '43_rls_core_security_isolation: esperaba % políticas branch_isolation en core/security, hay %', v_expected_tables, v_branch_policies;
    END IF;

    RAISE NOTICE '43_rls_core_security_isolation: OK — % tablas de core/security con company_isolation + branch_isolation (5 tablas de bootstrap excluidas a propósito, ver cabecera).', v_expected_tables;
END $$;
