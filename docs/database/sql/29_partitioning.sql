-- =============================================================================
-- GORAZUS ERP — 29_partitioning.sql
-- Gestión de particiones para las tablas de alto volumen identificadas en
-- docs/database/07-estrategia-particionamiento.md §1.
-- Depende de: 01_core.sql .. 28_materialized_views.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- NOTA IMPORTANTE — acción requerida antes del primer despliegue:
-- Postgres exige declarar `PARTITION BY RANGE (...)` en el momento del
-- `CREATE TABLE`; no se puede convertir una tabla ya creada como regular en
-- particionada sin recrearla. Los siguientes archivos YA declaran
-- `PARTITION BY RANGE` correctamente en la definición de tabla:
--   inventory.stock_movements (06), sales.invoices (07),
--   purchases.purchase_invoices (08), accounting.journal_entries (11),
--   hr.attendance_records (13), crm.call_logs/email_logs/whatsapp_logs (15),
--   cash.cash_movements (09), bi.kpi_snapshots/indicator_snapshots/
--   metric_snapshots (20).
--
-- Las siguientes tablas se documentaron como "particionada mensualmente" en
-- sus comentarios pero, al ser parte del archivo fundacional 01_core.sql/
-- 02_security.sql, requieren agregarles `PARTITION BY RANGE (<columna>)`
-- en su CREATE TABLE antes de la primera ejecución contra una base real:
--   core.audit_logs (occurred_at), core.system_logs (created_at),
--   core.activity_logs (created_at), core.notification_delivery_logs (created_at),
--   security.login_attempts (created_at), security.session_activity_logs (created_at).
-- Este es un ajuste a aplicar en 01_core.sql/02_security.sql antes del
-- primer `psql -f` contra una base nueva — no algo a corregir en una base
-- ya poblada (ver runbook de conversión al final de este archivo para ese
-- caso).
--
-- core.business_rule_evaluations y core.background_jobs (agregadas por
-- docs/architecture/32-core-platform/, SECCIÓN 13 de 01_core.sql) SÍ
-- declaran `PARTITION BY RANGE (created_at)` correctamente desde su
-- CREATE TABLE — no arrastran el gap de arriba, se suman directo a la
-- lista de `partman.create_parent()` en la sección 1.
-- -----------------------------------------------------------------------------

-- Bug real encontrado en FASE 05 (2026-07-20) al bootstrapear un cluster
-- limpio por primera vez: sin `SCHEMA partman`, la extensión cae en
-- `public` y toda llamada `partman.create_parent(...)` de abajo falla con
-- "schema partman does not exist" — nunca funcionó como estaba escrito.
CREATE SCHEMA IF NOT EXISTS partman;
CREATE EXTENSION IF NOT EXISTS pg_partman SCHEMA partman;

-- -----------------------------------------------------------------------------
-- 1. Configuración de pg_partman por tabla particionada (RANGE mensual)
-- -----------------------------------------------------------------------------

SELECT partman.create_parent(
    p_parent_table => 'inventory.stock_movements', p_control => 'created_at',
    p_interval => '1 month', p_premake => 3
);
SELECT partman.create_parent(
    p_parent_table => 'inventory.production_consumptions', p_control => 'created_at',
    p_interval => '1 month', p_premake => 3
);
SELECT partman.create_parent(
    p_parent_table => 'services.service_visits', p_control => 'created_at',
    p_interval => '1 month', p_premake => 3
);
SELECT partman.create_parent(
    p_parent_table => 'services.service_parts_consumed', p_control => 'created_at',
    p_interval => '1 month', p_premake => 3
);
SELECT partman.create_parent(
    p_parent_table => 'projects.project_timesheets', p_control => 'created_at',
    p_interval => '1 month', p_premake => 3
);
SELECT partman.create_parent(
    p_parent_table => 'projects.project_costs', p_control => 'created_at',
    p_interval => '1 month', p_premake => 3
);
SELECT partman.create_parent(
    p_parent_table => 'taxes.withholding_certificates', p_control => 'created_at',
    p_interval => '1 month', p_premake => 3
);
SELECT partman.create_parent(
    p_parent_table => 'cash.cash_movements', p_control => 'created_at',
    p_interval => '1 month', p_premake => 3
);
SELECT partman.create_parent(
    p_parent_table => 'crm.call_logs', p_control => 'created_at',
    p_interval => '1 month', p_premake => 3
);
SELECT partman.create_parent(
    p_parent_table => 'crm.email_logs', p_control => 'created_at',
    p_interval => '1 month', p_premake => 3
);
SELECT partman.create_parent(
    p_parent_table => 'crm.whatsapp_logs', p_control => 'created_at',
    p_interval => '1 month', p_premake => 3
);
SELECT partman.create_parent(
    p_parent_table => 'hr.attendance_records', p_control => 'checked_at',
    p_interval => '1 month', p_premake => 3
);
SELECT partman.create_parent(
    p_parent_table => 'bi.kpi_snapshots', p_control => 'snapshot_date',
    p_interval => '1 month', p_premake => 3
);
SELECT partman.create_parent(
    p_parent_table => 'bi.indicator_snapshots', p_control => 'snapshot_date',
    p_interval => '1 month', p_premake => 3
);
SELECT partman.create_parent(
    p_parent_table => 'bi.metric_snapshots', p_control => 'snapshot_date',
    p_interval => '1 month', p_premake => 3
);
SELECT partman.create_parent(
    p_parent_table => 'core.business_rule_evaluations', p_control => 'created_at',
    p_interval => '1 month', p_premake => 3
);
SELECT partman.create_parent(
    p_parent_table => 'core.background_jobs', p_control => 'created_at',
    p_interval => '1 month', p_premake => 3
);

-- Anuales, alineadas a ejercicio fiscal
SELECT partman.create_parent(
    p_parent_table => 'sales.invoices', p_control => 'issued_at',
    p_interval => '1 year', p_premake => 1
);
SELECT partman.create_parent(
    p_parent_table => 'purchases.purchase_invoices', p_control => 'received_at',
    p_interval => '1 year', p_premake => 1
);
SELECT partman.create_parent(
    p_parent_table => 'accounting.journal_entries', p_control => 'posting_date',
    p_interval => '1 year', p_premake => 1
);
SELECT partman.create_parent(
    p_parent_table => 'assets.asset_depreciation_entries', p_control => 'created_at',
    p_interval => '1 year', p_premake => 1
);

-- -----------------------------------------------------------------------------
-- 2. Configuración de retención automática (DETACH + archivado, ver
-- 07-estrategia-particionamiento.md §6 y 08-estrategia-respaldo.md §4)
-- -----------------------------------------------------------------------------

UPDATE partman.part_config
SET retention = '13 months', retention_keep_table = false
WHERE parent_table IN ('crm.call_logs', 'crm.email_logs', 'crm.whatsapp_logs', 'hr.attendance_records',
                        'core.business_rule_evaluations', 'core.background_jobs');

UPDATE partman.part_config
SET retention = '7 years', retention_keep_table = true  -- se conserva desconectada para archivado, no se elimina directo (ver 08-estrategia-respaldo.md §4)
WHERE parent_table IN ('sales.invoices', 'purchases.purchase_invoices', 'accounting.journal_entries');

-- -----------------------------------------------------------------------------
-- 3. Job programado de mantenimiento de particiones (crear futuras +
-- aplicar retención), registrado en core.scheduled_jobs
-- -----------------------------------------------------------------------------

INSERT INTO core.scheduled_jobs (tenant_id, job_code, cron_expression, created_by) VALUES
    ('00000000-0000-0000-0000-000000000000', 'partition_maintenance', '0 2 * * *', '00000000-0000-0000-0000-000000000001');
COMMENT ON TABLE core.scheduled_jobs IS 'El job partition_maintenance ejecuta partman.run_maintenance_proc() diariamente a las 02:00 — crea particiones futuras con antelación y aplica retención (DETACH) según part_config.';

-- -----------------------------------------------------------------------------
-- 4. Archivado de particiones desconectadas a MinIO (invocado tras cada
-- DETACH, ver 08-estrategia-respaldo.md §4). Implementación de referencia:
-- exporta a CSV comprimido antes de que un job externo lo suba al bucket
-- archive-cold y recién entonces se hace DROP TABLE de la partición.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION core.fn_export_detached_partition(p_partition_name TEXT, p_export_path TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    EXECUTE format('COPY %s TO %L WITH (FORMAT csv, HEADER true)', p_partition_name, p_export_path);
    RAISE NOTICE 'Partición % exportada a %. Pendiente: subir a bucket archive-cold y hacer DROP TABLE.', p_partition_name, p_export_path;
END;
$$;
COMMENT ON FUNCTION core.fn_export_detached_partition IS 'Exporta una partición desconectada a CSV antes de su archivado final en MinIO (bucket archive-cold) y posterior DROP.';

-- -----------------------------------------------------------------------------
-- 5. Runbook de conversión (referencia — NO ejecutable como script, es
-- procedimiento manual para cuando una tabla ya tiene datos en producción
-- y se decide particionarla retroactivamente):
--   1. CREATE TABLE <tabla>_new (LIKE <tabla> INCLUDING ALL) PARTITION BY RANGE (<col>);
--   2. Crear particiones necesarias para cubrir el rango de datos existente.
--   3. INSERT INTO <tabla>_new SELECT * FROM <tabla>; (por lotes si es grande)
--   4. Recrear FKs que apunten a <tabla> para que apunten a <tabla>_new.
--   5. ALTER TABLE <tabla> RENAME TO <tabla>_old; ALTER TABLE <tabla>_new RENAME TO <tabla>;
--   6. Validar conteos y DROP TABLE <tabla>_old tras period de gracia.
-- -----------------------------------------------------------------------------

-- =============================================================================
-- FIN 29_partitioning.sql
-- =============================================================================
