-- =============================================================================
-- GORAZUS ERP — 32_bugfixes.sql
-- Correcciones a 2 defectos reales encontrados al verificar la base de datos
-- contra 24_views.sql y 22_seed_data.sql (ver docs/database/DATABASE_HEALTH_REPORT.md
-- §1.2 y §1.3). Archivo nuevo — no edita ningún archivo ya existente, mantiene
-- el historial de migración append-only.
-- Depende de: 01_core.sql .. 31_missing_fk_indexes.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. accounting.v_treasury_position — la vista nunca se creó por columnas
-- ambiguas (company_id/branch_id sin calificar entre cash_movements y
-- cash_movement_types en el primer branch del UNION ALL). Mismo texto que
-- 24_views.sql líneas 93-109, con las 2 columnas ahora calificadas como
-- cm.company_id / cm.branch_id.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW accounting.v_treasury_position AS
SELECT cm.company_id, cm.branch_id, 'cash' AS source, SUM(
    CASE WHEN cmt.direction = 'in' THEN cm.amount ELSE -cm.amount END
) AS balance
FROM cash.cash_movements cm
JOIN cash.cash_movement_types cmt ON cmt.id = cm.movement_type_id
WHERE cm.deleted_at IS NULL
GROUP BY cm.company_id, cm.branch_id
UNION ALL
SELECT ba.company_id, ba.branch_id, 'bank' AS source, SUM(
    CASE WHEN bt.direction = 'in' THEN bt.amount ELSE -bt.amount END
) AS balance
FROM banks.bank_transfers bt
JOIN banks.bank_accounts ba ON ba.id = bt.bank_account_id
WHERE bt.deleted_at IS NULL
GROUP BY ba.company_id, ba.branch_id;
COMMENT ON VIEW accounting.v_treasury_position IS 'Posición consolidada de caja + bancos. Base de la capa "Tesorería" (sin schema propio).';

-- -----------------------------------------------------------------------------
-- 2. products.product_attributes.company_id — declarada NOT NULL, contradice
-- el patrón universal documentado (docs/database/01-modelo-conceptual.md §1.1:
-- "NULL = el registro aplica a todo el tenant"). Los atributos de producto
-- (color/talla/material) son catálogo compartido a nivel tenant, no por
-- empresa — se corrige la nulabilidad para alinear con el diseño ya
-- documentado, y se completa el seed de 22_seed_data.sql que había fallado
-- por esta misma razón (mismos 3 valores literales, sin inventar datos).
-- -----------------------------------------------------------------------------

ALTER TABLE products.product_attributes ALTER COLUMN company_id DROP NOT NULL;

INSERT INTO products.product_attributes (id, tenant_id, code, created_by) VALUES
    ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000000', 'color', '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000000', 'size', '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000000', 'material', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- FIN 32_bugfixes.sql
-- =============================================================================
