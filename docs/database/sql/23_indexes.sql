-- =============================================================================
-- GORAZUS ERP — 23_indexes.sql
-- Índices consolidados adicionales a los ya creados inline en 01-21 (PKs,
-- UNIQUEs de negocio, índices GIN de texto libre puntuales).
-- Implementa docs/database/04-estrategia-indices.md.
-- Depende de: 01_core.sql .. 21_configuration.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Índice de alcance de tenant (tenant_id, company_id, branch_id) parcial
-- en TODAS las tablas de negocio — ver 04-estrategia-indices.md §2.
-- Generado programáticamente en vez de 494 sentencias manuales: mismo
-- resultado, cero riesgo de copiar/pegar mal un nombre de tabla, y se
-- re-ejecuta automáticamente sobre cualquier tabla nueva que se agregue a
-- futuro sin tener que recordar añadir el índice a mano.
-- -----------------------------------------------------------------------------

DO $$
DECLARE
    r RECORD;
    idx_name TEXT;
BEGIN
    FOR r IN
        SELECT table_schema, table_name
        FROM information_schema.tables
        WHERE table_schema IN ('core','security','customers','suppliers','products','inventory',
                                'sales','purchases','cash','banks','accounting','taxes','crm',
                                'hr','payroll','services','projects','assets','reports','bi','configuration')
          AND table_type = 'BASE TABLE'
    LOOP
        idx_name := 'idx_' || r.table_schema || '_' || r.table_name || '_tenant_scope';
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = idx_name) THEN
            EXECUTE format(
                'CREATE INDEX %I ON %I.%I (tenant_id, company_id, branch_id) WHERE deleted_at IS NULL',
                idx_name, r.table_schema, r.table_name
            );
        END IF;
    END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 2. Índices GIN de búsqueda de texto libre adicionales (más allá de los ya
-- creados inline sobre customers.customers, suppliers.suppliers,
-- products.products en sus archivos respectivos) — ver §4 de la estrategia.
-- -----------------------------------------------------------------------------

CREATE INDEX idx_hr_employees_name_trgm ON hr.employees USING GIN (full_name gin_trgm_ops) WHERE deleted_at IS NULL;
CREATE INDEX idx_crm_leads_name_trgm ON crm.leads USING GIN (full_name gin_trgm_ops) WHERE deleted_at IS NULL;
CREATE INDEX idx_configuration_countries_name_trgm ON configuration.country_translations USING GIN (name gin_trgm_ops) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- 3. Índices BRIN para tablas de altísimo volumen append-only (ver §6).
-- Complementan (no reemplazan) las particiones de 29_partitioning.sql.
-- -----------------------------------------------------------------------------

CREATE INDEX idx_core_audit_logs_occurred_brin ON core.audit_logs USING BRIN (occurred_at);
CREATE INDEX idx_core_system_logs_created_brin ON core.system_logs USING BRIN (created_at);
CREATE INDEX idx_core_activity_logs_created_brin ON core.activity_logs USING BRIN (created_at);
CREATE INDEX idx_inventory_stock_movements_created_brin ON inventory.stock_movements USING BRIN (created_at);
CREATE INDEX idx_accounting_journal_entries_posting_brin ON accounting.journal_entries USING BRIN (posting_date);
CREATE INDEX idx_sales_invoices_issued_brin ON sales.invoices USING BRIN (issued_at);
CREATE INDEX idx_security_login_attempts_created_brin ON security.login_attempts USING BRIN (created_at);

-- -----------------------------------------------------------------------------
-- 4. Índices INCLUDE para cubrir queries frecuentes sin tocar la tabla
-- (ver §4, tabla de patrones).
-- -----------------------------------------------------------------------------

CREATE INDEX idx_sales_invoices_customer_covering ON sales.invoices (customer_id) INCLUDE (total_amount, issued_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_purchases_invoices_supplier_covering ON purchases.purchase_invoices (supplier_id) INCLUDE (total_amount, received_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_inventory_stock_product_covering ON inventory.stock (product_id) INCLUDE (quantity_on_hand, quantity_reserved) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- 5. Índices sobre metadata JSONB en tablas donde ya se confirmó un patrón
-- de filtro real (ver §7 — no se indexa metadata "por si acaso").
-- -----------------------------------------------------------------------------

CREATE INDEX idx_configuration_price_list_items_metadata ON configuration.price_list_items USING GIN (metadata jsonb_path_ops);
CREATE INDEX idx_core_system_settings_metadata ON core.system_settings USING GIN (metadata jsonb_path_ops);

-- -----------------------------------------------------------------------------
-- 6. Índices sobre FK de alto tráfico específicamente identificadas en
-- cada módulo lógico (encabezado→líneas es el patrón dominante, ya cubierto
-- por las FKs; acá solo las que no son la relación encabezado-línea obvia).
-- -----------------------------------------------------------------------------

CREATE INDEX idx_sales_commission_entries_salesperson ON sales.commission_entries (commission_rule_id);
CREATE INDEX idx_hr_leave_requests_employee_status ON hr.leave_requests (employee_id, status_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payroll_entries_employee ON payroll.payroll_entries (employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_crm_opportunities_stage ON crm.opportunities (funnel_stage_id) WHERE deleted_at IS NULL;

-- =============================================================================
-- FIN 23_indexes.sql
-- Mantenimiento continuo (REINDEX CONCURRENTLY, monitoreo de índices no
-- usados) descrito en docs/database/04-estrategia-indices.md §9 — no es
-- parte de este script de creación, es un runbook operativo recurrente.
-- =============================================================================
