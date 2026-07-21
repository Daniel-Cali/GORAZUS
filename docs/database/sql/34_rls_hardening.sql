-- =============================================================================
-- GORAZUS ERP — 34_rls_hardening.sql
-- FASE 05 (Enterprise Release) — corrige el hallazgo crítico ya diagnosticado
-- en docs/database/SECURITY.md §2 ("gorazus_app superusuario, RLS es un no-op
-- contra el tráfico real de la API"): colisión de identidad entre el
-- POSTGRES_USER de bootstrap de Docker y el rol de aplicación limitado que
-- 30_backup_restore.sql intentaba crear (el CREATE ROLE ... IF NOT EXISTS no
-- hacía nada porque el rol ya existía, superusuario, desde el initdb del
-- contenedor).
-- Archivo nuevo — no edita ningún archivo ya existente, mantiene el
-- historial de migración append-only.
-- Depende de: 01_core.sql .. 33_partition_provisioning_completion.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. gorazus_app deja de ser superusuario / bypass de RLS.
-- Sigue siendo dueño de las tablas que creó (ownership no cambia acá) — por
-- eso el paso 2 es obligatorio además de este: Postgres exime al dueño de
-- una tabla de sus propias políticas RLS salvo FORCE ROW LEVEL SECURITY.
-- -----------------------------------------------------------------------------
ALTER ROLE gorazus_app NOSUPERUSER NOBYPASSRLS;

-- -----------------------------------------------------------------------------
-- 2. FORCE ROW LEVEL SECURITY en todas las tablas reales de los 21 schemas de
-- negocio — sin esto, el paso 1 no alcanza (gorazus_app sigue siendo dueño).
-- Excluye explícitamente core.restore_test_logs (única tabla sin RLS
-- habilitado de las 501, ya documentada como plausiblemente intencional en
-- docs/database/SECURITY.md §1 — FORCE sobre una tabla sin RLS habilitado no
-- hace nada, pero se excluye del loop para que quede explícito, no accidental).
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    v_schema text;
    v_table text;
BEGIN
    FOR v_schema, v_table IN
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE schemaname IN (
            'accounting', 'assets', 'banks', 'bi', 'cash', 'configuration', 'core',
            'crm', 'customers', 'hr', 'inventory', 'payroll', 'products', 'projects',
            'purchases', 'reports', 'sales', 'security', 'services', 'suppliers', 'taxes'
        )
        AND NOT (schemaname = 'core' AND tablename = 'restore_test_logs')
    LOOP
        EXECUTE format('ALTER TABLE %I.%I FORCE ROW LEVEL SECURITY', v_schema, v_table);
    END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 3. Verificación — debe devolver 0 filas (ninguna tabla con RLS habilitado
-- sin forzar, fuera de la excepción documentada) y gorazus_app sin
-- superusuario/bypass.
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    v_unforced int;
    v_still_super boolean;
BEGIN
    SELECT count(*) INTO v_unforced
    FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = t.schemaname)
    WHERE t.schemaname NOT IN ('pg_catalog', 'information_schema')
      AND c.relrowsecurity = true AND c.relforcerowsecurity = false;

    SELECT rolsuper OR rolbypassrls INTO v_still_super FROM pg_roles WHERE rolname = 'gorazus_app';

    IF v_unforced > 0 THEN
        RAISE EXCEPTION '34_rls_hardening: % tablas con RLS habilitado sin FORCE — revisar', v_unforced;
    END IF;
    IF v_still_super THEN
        RAISE EXCEPTION '34_rls_hardening: gorazus_app todavía es superusuario o tiene bypassrls';
    END IF;
    RAISE NOTICE '34_rls_hardening: OK — gorazus_app sin superusuario/bypass, todas las tablas con RLS forzado.';
END $$;
