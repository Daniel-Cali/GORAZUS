-- =============================================================================
-- GORAZUS ERP — 28_materialized_views.sql
-- Vistas materializadas que alimentan bi.data_mart_tables (ver
-- docs/database/09-estrategia-replicacion.md §3) — aíslan la carga
-- analítica pesada de las tablas transaccionales.
-- Depende de: 01_core.sql .. 27_procedures.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Ventas diarias agregadas (base de KPIs comerciales)
-- -----------------------------------------------------------------------------

CREATE MATERIALIZED VIEW bi.mv_daily_sales_summary AS
SELECT
    i.company_id, i.branch_id, i.issued_at::date AS sale_date,
    p.category_id, so.salesperson_id,
    COUNT(DISTINCT i.id) AS invoice_count,
    SUM(il.quantity) AS units_sold,
    SUM(il.quantity * il.unit_price * (1 - il.discount_percentage / 100.0)) AS gross_amount,
    SUM(il.quantity * COALESCE(p.standard_cost, 0)) AS estimated_cost
FROM sales.invoice_lines il
JOIN sales.invoices i ON i.id = il.invoice_id
JOIN products.products p ON p.id = il.product_id
LEFT JOIN sales.sales_orders so ON so.id = i.sales_order_id
WHERE i.deleted_at IS NULL AND il.deleted_at IS NULL
GROUP BY i.company_id, i.branch_id, i.issued_at::date, p.category_id, so.salesperson_id
WITH NO DATA;

CREATE UNIQUE INDEX uq_mv_daily_sales_summary ON bi.mv_daily_sales_summary (company_id, branch_id, sale_date, category_id, COALESCE(salesperson_id, '00000000-0000-0000-0000-000000000000'));
COMMENT ON MATERIALIZED VIEW bi.mv_daily_sales_summary IS 'Ventas agregadas por día/sucursal/categoría/vendedor. Refrescada horariamente (ver core.scheduled_jobs). Índice único requerido para REFRESH ... CONCURRENTLY.';

-- -----------------------------------------------------------------------------
-- 2. Valorización de inventario actual
-- -----------------------------------------------------------------------------

CREATE MATERIALIZED VIEW bi.mv_inventory_valuation AS
SELECT
    s.company_id, s.branch_id, s.warehouse_id, p.category_id,
    SUM(s.quantity_on_hand) AS total_quantity,
    SUM(s.quantity_on_hand * COALESCE(p.standard_cost, 0)) AS total_value
FROM inventory.stock s
JOIN products.products p ON p.id = s.product_id
WHERE s.deleted_at IS NULL
GROUP BY s.company_id, s.branch_id, s.warehouse_id, p.category_id
WITH NO DATA;

CREATE UNIQUE INDEX uq_mv_inventory_valuation ON bi.mv_inventory_valuation (company_id, branch_id, warehouse_id, category_id);
COMMENT ON MATERIALIZED VIEW bi.mv_inventory_valuation IS 'Valor de inventario por almacén/categoría. Refrescada diariamente.';

-- -----------------------------------------------------------------------------
-- 3. Valor de vida del cliente (CLV) y RFM básico
-- -----------------------------------------------------------------------------

CREATE MATERIALIZED VIEW bi.mv_customer_lifetime_value AS
SELECT
    c.id AS customer_id, c.company_id,
    COUNT(DISTINCT i.id) AS total_invoices,
    SUM(i.total_amount) AS lifetime_revenue,
    MAX(i.issued_at) AS last_purchase_at,
    MIN(i.issued_at) AS first_purchase_at,
    (CURRENT_DATE - MAX(i.issued_at)::date) AS days_since_last_purchase
FROM customers.customers c
JOIN sales.invoices i ON i.customer_id = c.id AND i.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.company_id
WITH NO DATA;

CREATE UNIQUE INDEX uq_mv_customer_ltv ON bi.mv_customer_lifetime_value (customer_id);
COMMENT ON MATERIALIZED VIEW bi.mv_customer_lifetime_value IS 'Valor histórico y recencia de compra por cliente. Refrescada diariamente. Base de segmentación RFM en BI.';

-- -----------------------------------------------------------------------------
-- 4. Resumen de antigüedad de saldos (CxC/CxP consolidado por bucket)
-- -----------------------------------------------------------------------------

CREATE MATERIALIZED VIEW bi.mv_aging_summary AS
SELECT 'receivable' AS balance_type, aging_bucket, SUM(open_balance) AS total_amount, COUNT(*) AS document_count
FROM customers.v_accounts_receivable_aging GROUP BY aging_bucket
UNION ALL
SELECT 'payable' AS balance_type, aging_bucket, SUM(total_amount) AS total_amount, COUNT(*) AS document_count
FROM suppliers.v_accounts_payable_aging GROUP BY aging_bucket
WITH NO DATA;

COMMENT ON MATERIALIZED VIEW bi.mv_aging_summary IS 'Antigüedad de saldos consolidada CxC/CxP por bucket. Refrescada cada hora — alimenta el widget de Tesorería en el Dashboard.';

-- -----------------------------------------------------------------------------
-- 5. Registro en bi.data_mart_tables (ver 20_bi.sql)
-- -----------------------------------------------------------------------------

INSERT INTO bi.data_mart_tables (tenant_id, materialized_view_name, refresh_frequency, created_by) VALUES
    ('00000000-0000-0000-0000-000000000000', 'bi.mv_daily_sales_summary', 'hourly', '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000', 'bi.mv_inventory_valuation', 'daily', '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000', 'bi.mv_customer_lifetime_value', 'daily', '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000', 'bi.mv_aging_summary', 'hourly', '00000000-0000-0000-0000-000000000001');

-- -----------------------------------------------------------------------------
-- 6. Función de refresco (invocada por core.scheduled_jobs según la
-- frecuencia registrada arriba)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION bi.fn_refresh_data_marts(p_frequency TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT materialized_view_name FROM bi.data_mart_tables WHERE refresh_frequency = p_frequency AND deleted_at IS NULL LOOP
        EXECUTE format('REFRESH MATERIALIZED VIEW CONCURRENTLY %s', r.materialized_view_name);
    END LOOP;
END;
$$;
COMMENT ON FUNCTION bi.fn_refresh_data_marts IS 'Refresca todas las vistas materializadas de una frecuencia dada. CONCURRENTLY evita bloquear lecturas durante el refresco (requiere el índice único de cada MV).';

-- =============================================================================
-- FIN 28_materialized_views.sql
-- Primer refresco: ejecutar manualmente REFRESH MATERIALIZED VIEW (sin
-- CONCURRENTLY, ya que WITH NO DATA las deja vacías) antes de exponerlas a
-- reports/bi por primera vez.
-- =============================================================================
