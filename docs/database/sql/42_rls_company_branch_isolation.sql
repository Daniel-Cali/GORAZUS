-- =============================================================================
-- GORAZUS ERP — 42_rls_company_branch_isolation.sql
-- FASE 05 (Enterprise Release) — corrige un hallazgo crítico de una
-- auditoría completa del proyecto (modo solo lectura, sesión de
-- desarrollo asistida por IA): `core/database/src/tenant-scope.ts`
-- (`withTenantScope`) ya fija `app.current_company_ids` vía `set_config`
-- en cada transacción, y `docs/database/06-estrategia-seguridad.md §1`
-- ya documentaba una política `company_isolation` como si existiera —
-- pero, verificado contra el SQL real aplicado (`30_backup_restore.sql`
-- §2, `34_rls_hardening.sql`, `35_functional_completion.sql`,
-- `36_crm_customer_completion.sql`), solo `tenant_isolation` existe de
-- verdad. Ninguna política lee `app.current_company_ids`, y no existía
-- ningún mecanismo para `branch_id` (ni `set_config` ni política). Este
-- archivo hace real lo que el diseño ya declaraba, no diseña algo nuevo.
--
-- Archivo nuevo — no edita ningún archivo ya existente, mantiene el
-- historial de migración append-only.
-- Depende de: 01_core.sql .. 41_ventas_pedidos_facturacion_parcial.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Políticas RESTRICTIVE (no PERMISSIVE) — punto crítico de corrección.
-- Las políticas permisivas (como `tenant_isolation`) se combinan entre sí
-- con OR — si estas fueran permisivas normales, un `company_id`
-- coincidente de un TENANT DISTINTO bastaría para ver la fila (OR con
-- `tenant_isolation`), un agujero peor que el actual. `AS RESTRICTIVE` se
-- combina con AND sobre el resultado ya filtrado por las políticas
-- permisivas: una fila debe pasar `tenant_isolation` Y ADEMÁS
-- `company_isolation` Y ADEMÁS `branch_isolation`.
--
-- `company_id IS NULL OR ...` / `branch_id IS NULL OR ...`: mismo
-- criterio que ya usa `tenant_isolation` con el tenant sentinela —
-- columna nula = visible en el alcance superior. `company_id`/`branch_id`
-- son NULLABLE en casi todas las 504 tablas del sistema (auditoría
-- universal, ver comentario de cada archivo `NN_*.sql` base); en las
-- pocas tablas donde son NOT NULL (ej. `inventory.warehouses`), la rama
-- `IS NULL` simplemente nunca aplica y el filtro por igualdad sigue
-- siendo correcto. Si `current_setting(..., true)` no fue seteado (el
-- segundo `set_config` de `withTenantScope` es condicional), devuelve
-- NULL — `NULL::uuid` es NULL sin error, la comparación de igualdad da
-- NULL (no true), así que una fila con `company_id`/`branch_id` real
-- queda oculta por defecto ante contexto ausente (seguro por omisión).
--
-- -----------------------------------------------------------------------------
-- 2. ALCANCE DELIBERADAMENTE LIMITADO a 19 schemas de negocio —
-- excluye `core` y `security`.
--
-- Investigación previa a este archivo encontró que 3 repositorios de
-- `auth` llaman `withTenantScope` con un contexto mínimo
-- `{ tenantId, companyId: null }` — SIN `companyId` real — porque se
-- ejecutan ANTES de que el login resuelva qué usuario/empresa es (son
-- los propios lookups que buscan al usuario):
--   - `core.users`                         (user.repository.prisma.ts)
--   - `core.login_attempts`                (login-attempt.repository.prisma.ts)
--   - `security.two_factor_credentials`    (two-factor-credential.repository.prisma.ts)
-- Si esta política se aplicara ciegamente sobre esas tablas, el login se
-- rompería por completo: `core.users.company_id` normalmente NO es nulo
-- para un usuario real, y con `app.current_company_ids` sin fijar
-- (todavía no se sabe), la fila del usuario dejaría de ser visible —
-- nadie podría autenticarse. Esto no se puede verificar contra Postgres
-- real en el entorno donde se escribió este archivo (Docker no estaba
-- activo), así que el alcance se acota en vez de arriesgar romper
-- autenticación sin poder probarlo.
--
-- `core`/`security` quedan como deuda registrada explícitamente
-- (`docs/AKB/00 Governance/Issue Register.md`) — requieren revisar caso
-- por caso qué tablas participan en flujos de bootstrap (login, refresh,
-- 2FA — puede haber más de las 3 ya identificadas) antes de aplicarles
-- esta misma política, posiblemente con excepciones puntuales
-- permisivas por tabla, mismo criterio ya usado en `core.tenants`
-- (`tenant_lookup_by_slug`) y `core.sessions`
-- (`session_lookup_by_refresh_hash`) para el aislamiento de tenant.
-- -----------------------------------------------------------------------------

DO $$
DECLARE
    v_schema text;
    v_table text;
BEGIN
    FOR v_schema, v_table IN
        SELECT table_schema, table_name
        FROM information_schema.tables
        WHERE table_schema IN (
            'accounting', 'assets', 'banks', 'bi', 'cash', 'configuration', 'crm', 'customers',
            'hr', 'inventory', 'payroll', 'products', 'projects', 'purchases', 'reports', 'sales',
            'services', 'suppliers', 'taxes'
        )
        AND table_type = 'BASE TABLE'
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

COMMENT ON POLICY company_isolation ON inventory.warehouses IS 'Restrictiva (AND, no OR) sobre tenant_isolation — aísla por empresa dentro del mismo tenant. NULL = visible en todo el tenant (catálogos sin empresa asignada). Ver 42_rls_company_branch_isolation.sql cabecera.';
COMMENT ON POLICY branch_isolation ON inventory.warehouses IS 'Restrictiva (AND, no OR) sobre tenant_isolation — aísla por sucursal dentro de la misma empresa. NULL = visible en toda la empresa. Ver 42_rls_company_branch_isolation.sql cabecera.';

-- -----------------------------------------------------------------------------
-- 3. Verificación — debe devolver 0 filas (cada tabla base de los 19
-- schemas debe tener exactamente 1 `company_isolation` + 1
-- `branch_isolation`, ni más ni menos).
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    v_expected_tables int;
    v_company_policies int;
    v_branch_policies int;
BEGIN
    SELECT count(*) INTO v_expected_tables
    FROM information_schema.tables
    WHERE table_schema IN (
        'accounting', 'assets', 'banks', 'bi', 'cash', 'configuration', 'crm', 'customers',
        'hr', 'inventory', 'payroll', 'products', 'projects', 'purchases', 'reports', 'sales',
        'services', 'suppliers', 'taxes'
    )
    AND table_type = 'BASE TABLE';

    SELECT count(*) INTO v_company_policies FROM pg_policies WHERE policyname = 'company_isolation';
    SELECT count(*) INTO v_branch_policies FROM pg_policies WHERE policyname = 'branch_isolation';

    IF v_company_policies <> v_expected_tables THEN
        RAISE EXCEPTION '42_rls_company_branch_isolation: esperaba % políticas company_isolation, hay %', v_expected_tables, v_company_policies;
    END IF;
    IF v_branch_policies <> v_expected_tables THEN
        RAISE EXCEPTION '42_rls_company_branch_isolation: esperaba % políticas branch_isolation, hay %', v_expected_tables, v_branch_policies;
    END IF;

    RAISE NOTICE '42_rls_company_branch_isolation: OK — % tablas con company_isolation + branch_isolation (schemas core/security deliberadamente excluidos, ver cabecera).', v_expected_tables;
END $$;
