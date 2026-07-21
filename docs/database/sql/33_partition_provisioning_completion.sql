-- =============================================================================
-- GORAZUS ERP — 33_partition_provisioning_completion.sql
-- Completa el aprovisionamiento real de particiones (docs/database/07-estrategia-
-- particionamiento.md §3, pg_partman) — ver docs/database/DATABASE_HEALTH_REPORT.md
-- §1.1 para el hallazgo original y su causa raíz completa:
--   (a) postgres:17-alpine no incluía pg_partman — resuelto cambiando la imagen
--       de Postgres (ver infra/docker/postgres/Dockerfile), no en este archivo.
--   (b) 29_partitioning.sql instala pg_partman sin cláusula SCHEMA, cae en
--       "public" en vez de "partman" — resuelto manualmente en esta sesión
--       (DROP/CREATE EXTENSION pg_partman SCHEMA partman) antes de este archivo.
--   (c) 29_partitioning.sql nunca incluye 6 de las 27 tablas declaradas
--       PARTITION BY en sus llamadas a partman.create_parent() — completado acá:
--       core.audit_logs, core.system_logs, core.activity_logs,
--       core.notification_delivery_logs, security.login_attempts,
--       security.session_activity_logs (documentadas en 07-estrategia-
--       particionamiento.md §1 pero ausentes en 29_partitioning.sql §1).
-- Archivo nuevo — no edita 29_partitioning.sql ni ningún otro archivo existente.
-- Depende de: 01_core.sql .. 32_bugfixes.sql, más la extensión pg_partman
-- instalada en el schema "partman" (ver nota arriba, paso manual documentado
-- en docs/database/DATABASE_HEALTH_REPORT.md §1.1).
-- =============================================================================

SELECT partman.create_parent(
    p_parent_table => 'core.audit_logs', p_control => 'occurred_at',
    p_interval => '1 month', p_premake => 3
);
SELECT partman.create_parent(
    p_parent_table => 'core.system_logs', p_control => 'created_at',
    p_interval => '1 month', p_premake => 3
);
SELECT partman.create_parent(
    p_parent_table => 'core.activity_logs', p_control => 'created_at',
    p_interval => '1 month', p_premake => 3
);
SELECT partman.create_parent(
    p_parent_table => 'core.notification_delivery_logs', p_control => 'created_at',
    p_interval => '1 month', p_premake => 3
);
SELECT partman.create_parent(
    p_parent_table => 'security.login_attempts', p_control => 'created_at',
    p_interval => '1 month', p_premake => 3
);
SELECT partman.create_parent(
    p_parent_table => 'security.session_activity_logs', p_control => 'created_at',
    p_interval => '1 month', p_premake => 3
);

-- -----------------------------------------------------------------------------
-- Retención de estas 6 tablas — mismo criterio que los logs ya configurados en
-- 29_partitioning.sql §2 (crm.call_logs, etc.): 13 meses, sin conservar la
-- partición desconectada (no son documentos fiscales).
-- -----------------------------------------------------------------------------

UPDATE partman.part_config
SET retention = '13 months', retention_keep_table = false
WHERE parent_table IN (
    'core.audit_logs', 'core.system_logs', 'core.activity_logs',
    'core.notification_delivery_logs', 'security.login_attempts',
    'security.session_activity_logs'
);

-- -----------------------------------------------------------------------------
-- Completa 29_partitioning.sql §3-4, que no se habían aplicado porque el
-- INSERT a core.scheduled_jobs disparó el trigger de auditoría hacia
-- core.audit_logs antes de que esa tabla tuviera particiones (mismo hallazgo,
-- efecto en cascada). Ahora que audit_logs ya tiene partición, se completa:
-- -----------------------------------------------------------------------------

INSERT INTO core.scheduled_jobs (tenant_id, job_code, cron_expression, created_by)
SELECT '00000000-0000-0000-0000-000000000000', 'partition_maintenance', '0 2 * * *', '00000000-0000-0000-0000-000000000001'
WHERE NOT EXISTS (
    SELECT 1 FROM core.scheduled_jobs WHERE job_code = 'partition_maintenance'
);
COMMENT ON TABLE core.scheduled_jobs IS 'El job partition_maintenance ejecuta partman.run_maintenance_proc() diariamente a las 02:00 — crea particiones futuras con antelación y aplica retención (DETACH) según part_config.';

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

-- =============================================================================
-- FIN 33_partition_provisioning_completion.sql
-- =============================================================================
