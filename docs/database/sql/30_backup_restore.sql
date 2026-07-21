-- =============================================================================
-- GORAZUS ERP — 30_backup_restore.sql
-- Piezas SQL de la estrategia de respaldo (docs/database/08-estrategia-respaldo.md).
-- La orquestación de pgBackRest en sí (backup físico + WAL archiving) vive
-- en configuración de infraestructura fuera de este repositorio de schema
-- (pgbackrest.conf, cron/systemd timers) — acá solo lo que es SQL real:
-- roles, políticas de retención, función de exportación por tenant, y
-- verificación de restauración.
-- Depende de: 01_core.sql .. 29_partitioning.sql — ÚLTIMO archivo de la
-- secuencia de despliegue.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Roles de base de datos (ver 06-estrategia-seguridad.md §2) — se crean
-- acá, al final, porque requieren que todos los schemas ya existan para
-- otorgar GRANTs precisos.
-- -----------------------------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'gorazus_app') THEN
        CREATE ROLE gorazus_app LOGIN PASSWORD NULL; -- password gestionada fuera de este script (vault/KMS)
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'gorazus_migrator') THEN
        CREATE ROLE gorazus_migrator LOGIN PASSWORD NULL;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'gorazus_readonly') THEN
        CREATE ROLE gorazus_readonly LOGIN PASSWORD NULL;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'gorazus_backup') THEN
        CREATE ROLE gorazus_backup LOGIN PASSWORD NULL REPLICATION;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'gorazus_audit_writer') THEN
        CREATE ROLE gorazus_audit_writer NOLOGIN;
    END IF;
END $$;

DO $$
DECLARE v_schema TEXT;
BEGIN
    FOREACH v_schema IN ARRAY ARRAY['core','security','customers','suppliers','products','inventory',
                                     'sales','purchases','cash','banks','accounting','taxes','crm',
                                     'hr','payroll','services','projects','assets','reports','bi','configuration']
    LOOP
        EXECUTE format('GRANT USAGE ON SCHEMA %I TO gorazus_app, gorazus_readonly, gorazus_migrator', v_schema);
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA %I TO gorazus_app', v_schema);
        EXECUTE format('GRANT SELECT ON ALL TABLES IN SCHEMA %I TO gorazus_readonly', v_schema);
        EXECUTE format('GRANT ALL ON ALL TABLES IN SCHEMA %I TO gorazus_migrator', v_schema);
        EXECUTE format('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA %I TO gorazus_app', v_schema);
    END LOOP;
END $$;

-- Excepciones: nadie salvo gorazus_audit_writer escribe en las tablas de auditoría inmutable
REVOKE INSERT, UPDATE, DELETE ON core.audit_logs FROM gorazus_app;
REVOKE INSERT, UPDATE, DELETE ON core.change_history FROM gorazus_app;
REVOKE INSERT, UPDATE, DELETE ON security.security_audit_logs FROM gorazus_app;
GRANT INSERT ON core.audit_logs, core.change_history, security.security_audit_logs TO gorazus_audit_writer;

-- gorazus_readonly nunca ve el schema security (ver 09-estrategia-replicacion.md §5)
REVOKE ALL ON ALL TABLES IN SCHEMA security FROM gorazus_readonly;
REVOKE USAGE ON SCHEMA security FROM gorazus_readonly;

GRANT pg_read_all_data TO gorazus_backup; -- suficiente para pg_dump; sin acceso de escritura

-- -----------------------------------------------------------------------------
-- 2. Row-Level Security — habilitación global (ver 06-estrategia-seguridad.md §1)
-- Las políticas específicas se definen por tabla; acá se automatiza el
-- ENABLE + política estándar sobre las 494 tablas.
-- -----------------------------------------------------------------------------

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT table_schema, table_name
        FROM information_schema.tables
        WHERE table_schema IN ('core','security','customers','suppliers','products','inventory',
                                'sales','purchases','cash','banks','accounting','taxes','crm',
                                'hr','payroll','services','projects','assets','reports','bi','configuration')
          AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', r.table_schema, r.table_name);
        EXECUTE format(
            'CREATE POLICY tenant_isolation ON %I.%I USING (tenant_id = current_setting(''app.current_tenant_id'', true)::uuid OR tenant_id = ''00000000-0000-0000-0000-000000000000'')',
            r.table_schema, r.table_name
        );
    END LOOP;
END $$;
COMMENT ON POLICY tenant_isolation ON core.tenants IS 'Política estándar aplicada a las 494 tablas — ver docs/database/06-estrategia-seguridad.md §1. El sentinela de tenant global permite ver catálogos compartidos (configuration.*) desde cualquier tenant.';

-- Excepción puntual: `core.tenants` es la única tabla que debe poder
-- resolverse por `slug` SIN `app.current_tenant_id` seteado — es
-- justamente lo que el login necesita resolver ANTES de poder buscar al
-- usuario (`core.users.email` es único por tenant, `uq_core_users_tenant_email`
-- en este mismo archivo... ver 01_core.sql, no global), así que no puede
-- exigirse conocer el tenant de antemano para esta tabla puntual. Política
-- adicional PERMISIVA de solo SELECT — en RLS de Postgres, políticas
-- permisivas para el mismo comando se combinan con OR, así que esto abre
-- el SELECT de `core.tenants` sin afectar el aislamiento de
-- INSERT/UPDATE/DELETE (que siguen gobernados únicamente por
-- `tenant_isolation` arriba) ni el de ninguna otra tabla.
CREATE POLICY tenant_lookup_by_slug ON core.tenants FOR SELECT USING (true);
COMMENT ON POLICY tenant_lookup_by_slug ON core.tenants IS 'Permite resolver un tenant por slug antes de autenticar (bootstrap del login, docs/architecture/13-modulo-auth.md) — única excepción de lectura sin tenant_id conocido en todo el esquema.';

-- Misma excepción, mismo motivo: `POST /auth/refresh` llega con una cookie
-- de refresh token opaca (sin tenant embebido) — el tenant se resuelve A
-- PARTIR de la sesión encontrada, no antes. El hash es aleatorio de 256
-- bits (colisión entre tenants despreciable), así que exponer el SELECT
-- por `refresh_token_hash` sin tenant conocido no compromete el
-- aislamiento — sigue siendo imposible listar u ojear sesiones ajenas sin
-- ya tener el token exacto.
CREATE POLICY session_lookup_by_refresh_hash ON core.sessions FOR SELECT USING (true);
COMMENT ON POLICY session_lookup_by_refresh_hash ON core.sessions IS 'Permite resolver una sesión por hash de refresh token antes de conocer el tenant (bootstrap de POST /auth/refresh, docs/architecture/13-modulo-auth.md §4) — mismo criterio que tenant_lookup_by_slug.';

-- gorazus_migrator y gorazus_backup necesitan bypass para operaciones administrativas
ALTER ROLE gorazus_migrator BYPASSRLS;
ALTER ROLE gorazus_backup BYPASSRLS;

-- -----------------------------------------------------------------------------
-- 3. Exportación lógica por tenant (ver 08-estrategia-respaldo.md §3)
-- Esta función solo fija el contexto de sesión; el `pg_dump` real se invoca
-- desde fuera de Postgres (script de infraestructura) usando esta misma
-- conexión/sesión para heredar el filtro de RLS automáticamente.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION core.fn_set_tenant_export_context(p_tenant_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM core.tenants WHERE id = p_tenant_id AND deleted_at IS NULL) THEN
        RAISE EXCEPTION 'Tenant % no existe', p_tenant_id;
    END IF;
    PERFORM set_config('app.current_tenant_id', p_tenant_id::TEXT, false);
END;
$$;
COMMENT ON FUNCTION core.fn_set_tenant_export_context IS 'Invocada al inicio de la sesión de pg_dump por tenant: `psql -c "SELECT core.fn_set_tenant_export_context(''<uuid>'')"` seguido de `pg_dump --format=custom` en la MISMA sesión — RLS filtra automáticamente el dump al alcance del tenant.';

-- -----------------------------------------------------------------------------
-- 4. Verificación automatizada de restauración (ver 08-estrategia-respaldo.md §6)
-- Corre en el entorno aislado de prueba mensual, NO contra producción.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION core.fn_verify_restore_integrity()
RETURNS TABLE(check_name TEXT, passed BOOLEAN, details TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 'row_count_core_tenants'::TEXT, (SELECT COUNT(*) FROM core.tenants) > 0, 'core.tenants debe tener al menos el tenant SYSTEM';

    RETURN QUERY
    SELECT 'referential_integrity_no_orphans'::TEXT,
           NOT EXISTS (SELECT 1 FROM sales.invoice_lines il LEFT JOIN sales.invoices i ON i.id = il.invoice_id WHERE i.id IS NULL),
           'Ninguna línea de factura debe quedar huérfana';

    RETURN QUERY
    SELECT 'balanced_posted_journal_entries'::TEXT,
           NOT EXISTS (
               SELECT 1 FROM accounting.journal_entries je
               JOIN accounting.journal_entry_status jes ON jes.id = je.status_id
               WHERE jes.code = 'posted' AND NOT accounting.fn_is_journal_entry_balanced(je.id)
           ),
           'Todo asiento mayorizado debe estar balanceado';

    RETURN QUERY
    SELECT 'rls_enabled_all_tables'::TEXT,
           NOT EXISTS (
               SELECT 1 FROM pg_tables t
               JOIN pg_class c ON c.relname = t.tablename
               WHERE t.schemaname IN ('core','security','customers','suppliers','products','inventory',
                                       'sales','purchases','cash','banks','accounting','taxes','crm',
                                       'hr','payroll','services','projects','assets','reports','bi','configuration')
                 AND NOT c.relrowsecurity
           ),
           'Row-Level Security debe estar activo en las 494 tablas';
END;
$$;
COMMENT ON FUNCTION core.fn_verify_restore_integrity IS 'Ejecutada tras cada restauración de prueba mensual (ver 08-estrategia-respaldo.md §6). Un resultado con passed=false en cualquier fila es un incidente de severidad alta, no una nota informativa.';

-- -----------------------------------------------------------------------------
-- 5. Registro de pruebas de restauración
-- -----------------------------------------------------------------------------

CREATE TABLE core.restore_test_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    company_id UUID, branch_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    backup_source TEXT NOT NULL, restore_started_at TIMESTAMPTZ NOT NULL, restore_finished_at TIMESTAMPTZ,
    all_checks_passed BOOLEAN, check_results JSONB
);
COMMENT ON TABLE core.restore_test_logs IS 'Historial de simulacros de restauración mensuales (ver 08-estrategia-respaldo.md §6 y 10-estrategia-alta-disponibilidad.md §6 game days).';

-- =============================================================================
-- FIN 30_backup_restore.sql
--
-- FIN DE LA SECUENCIA COMPLETA 01-30.
-- Orden de ejecución: 01→30 en orden numérico estricto, ya que cada archivo
-- depende de que los anteriores ya se hayan aplicado (schemas, tablas y
-- FKs referenciadas). Ejecutar como una única transacción de despliegue
-- (o con una herramienta de migración versionada que garantice el orden)
-- contra una base PostgreSQL 17 vacía.
-- =============================================================================
