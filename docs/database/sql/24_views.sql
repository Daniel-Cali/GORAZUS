-- =============================================================================
-- GORAZUS ERP — 24_views.sql
-- Vistas derivadas que reemplazan tablas base evitadas deliberadamente
-- (ver docs/database/02-modelo-logico.md §4 — kardex, libro mayor, libro de
-- IVA, tesorería son 100% derivables, no se duplican como tablas).
-- Depende de: 01_core.sql .. 21_configuration.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Kardex de inventario (sustituye a inventory.kardex_entries)
-- -----------------------------------------------------------------------------

CREATE VIEW inventory.v_kardex AS
SELECT
    sm.tenant_id, sm.company_id, sm.branch_id,
    sm.product_id, sm.warehouse_id, sm.movement_type_id, mt.direction,
    sm.quantity, sm.unit_cost, (sm.quantity * COALESCE(sm.unit_cost, 0)) AS movement_value,
    sm.created_at AS movement_date,
    SUM(CASE WHEN mt.direction = 'in' THEN sm.quantity ELSE -sm.quantity END)
        OVER (PARTITION BY sm.product_id, sm.warehouse_id ORDER BY sm.created_at
              ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_balance
FROM inventory.stock_movements sm
JOIN inventory.stock_movement_types mt ON mt.id = sm.movement_type_id
WHERE sm.deleted_at IS NULL;
COMMENT ON VIEW inventory.v_kardex IS 'Kardex de producto con saldo corrido. Sustituye una tabla inventory.kardex_entries — 100% derivable de stock_movements.';

-- -----------------------------------------------------------------------------
-- 2. Libro Mayor y Balance de Comprobación (sustituyen tablas de saldo base)
-- -----------------------------------------------------------------------------

CREATE VIEW accounting.v_general_ledger AS
SELECT
    jel.tenant_id, je.company_id, je.branch_id,
    jel.account_id, coa.code AS account_code, coa.name AS account_name,
    je.posting_date, je.document_number, jel.debit_amount, jel.credit_amount,
    SUM(jel.debit_amount - jel.credit_amount)
        OVER (PARTITION BY jel.account_id ORDER BY je.posting_date, je.local_id
              ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_balance
FROM accounting.journal_entry_lines jel
JOIN accounting.journal_entries je ON je.id = jel.journal_entry_id
JOIN accounting.chart_of_accounts coa ON coa.id = jel.account_id
JOIN accounting.journal_entry_status jes ON jes.id = je.status_id
WHERE jel.deleted_at IS NULL AND jes.code = 'posted';
COMMENT ON VIEW accounting.v_general_ledger IS 'Libro Mayor con saldo corrido por cuenta. Solo asientos mayorizados (posted).';

CREATE VIEW accounting.v_trial_balance AS
SELECT
    account_id, account_code, account_name, company_id, branch_id,
    SUM(debit_amount) AS total_debit, SUM(credit_amount) AS total_credit,
    SUM(debit_amount) - SUM(credit_amount) AS net_balance
FROM accounting.v_general_ledger
GROUP BY account_id, account_code, account_name, company_id, branch_id;
COMMENT ON VIEW accounting.v_trial_balance IS 'Balance de Comprobación (sumas y saldos) a la fecha actual.';

-- -----------------------------------------------------------------------------
-- 3. Libros de IVA / impuesto (ventas y compras)
-- -----------------------------------------------------------------------------

CREATE VIEW taxes.v_sales_tax_ledger AS
SELECT
    il.tenant_id, i.company_id, i.branch_id, i.document_number, i.issued_at,
    il.tax_id, t.code AS tax_code, il.quantity, il.unit_price,
    (il.quantity * il.unit_price * (1 - il.discount_percentage / 100.0)) AS taxable_base,
    tr.rate_percentage,
    (il.quantity * il.unit_price * (1 - il.discount_percentage / 100.0) * tr.rate_percentage / 100.0) AS tax_amount
FROM sales.invoice_lines il
JOIN sales.invoices i ON i.id = il.invoice_id
JOIN taxes.taxes t ON t.id = il.tax_id
JOIN taxes.tax_rates tr ON tr.tax_id = t.id AND i.issued_at::date BETWEEN tr.effective_from AND COALESCE(tr.effective_to, 'infinity'::date)
WHERE il.deleted_at IS NULL AND i.deleted_at IS NULL;
COMMENT ON VIEW taxes.v_sales_tax_ledger IS 'Libro de IVA/impuesto de ventas — detalle fiscal derivado de sales.invoice_lines, no tabla base.';

CREATE VIEW taxes.v_purchase_tax_ledger AS
SELECT
    pil.tenant_id, pi.company_id, pi.branch_id, pi.supplier_document_number, pi.received_at,
    pil.tax_id, t.code AS tax_code, pil.quantity, pil.unit_cost,
    (pil.quantity * pil.unit_cost) AS taxable_base,
    tr.rate_percentage,
    (pil.quantity * pil.unit_cost * tr.rate_percentage / 100.0) AS tax_amount
FROM purchases.purchase_invoice_lines pil
JOIN purchases.purchase_invoices pi ON pi.id = pil.purchase_invoice_id
JOIN taxes.taxes t ON t.id = pil.tax_id
JOIN taxes.tax_rates tr ON tr.tax_id = t.id AND pi.received_at::date BETWEEN tr.effective_from AND COALESCE(tr.effective_to, 'infinity'::date)
WHERE pil.deleted_at IS NULL AND pi.deleted_at IS NULL;
COMMENT ON VIEW taxes.v_purchase_tax_ledger IS 'Libro de IVA/impuesto de compras.';

-- -----------------------------------------------------------------------------
-- 4. Tesorería — el schema "tesoreria" no existe (ver docs/architecture/
-- 04-catalogo-modulos-negocio.md); es 100% proyección sobre cash+banks+
-- customers+suppliers.
-- -----------------------------------------------------------------------------

CREATE VIEW accounting.v_treasury_position AS
SELECT company_id, branch_id, 'cash' AS source, SUM(
    CASE WHEN cmt.direction = 'in' THEN cm.amount ELSE -cm.amount END
) AS balance
FROM cash.cash_movements cm
JOIN cash.cash_movement_types cmt ON cmt.id = cm.movement_type_id
WHERE cm.deleted_at IS NULL
GROUP BY company_id, branch_id
UNION ALL
SELECT ba.company_id, ba.branch_id, 'bank' AS source, SUM(
    CASE WHEN bt.direction = 'in' THEN bt.amount ELSE -bt.amount END
) AS balance
FROM banks.bank_transfers bt
JOIN banks.bank_accounts ba ON ba.id = bt.bank_account_id
WHERE bt.deleted_at IS NULL
GROUP BY ba.company_id, ba.branch_id;
COMMENT ON VIEW accounting.v_treasury_position IS 'Posición consolidada de caja + bancos. Base de la capa "Tesorería" (sin schema propio).';

CREATE VIEW customers.v_accounts_receivable_aging AS
SELECT
    i.customer_id, c.legal_name,
    i.id AS invoice_id, i.document_number, i.total_amount,
    i.total_amount - COALESCE(SUM(ra.amount_applied), 0) AS open_balance,
    (CURRENT_DATE - i.issued_at::date) AS days_outstanding,
    CASE
        WHEN (CURRENT_DATE - i.issued_at::date) <= 30 THEN '0-30'
        WHEN (CURRENT_DATE - i.issued_at::date) <= 60 THEN '31-60'
        WHEN (CURRENT_DATE - i.issued_at::date) <= 90 THEN '61-90'
        ELSE '90+'
    END AS aging_bucket
FROM sales.invoices i
JOIN customers.customers c ON c.id = i.customer_id
LEFT JOIN sales.receipt_allocations ra ON ra.invoice_id = i.id AND ra.deleted_at IS NULL
WHERE i.deleted_at IS NULL
GROUP BY i.customer_id, c.legal_name, i.id, i.document_number, i.total_amount, i.issued_at
HAVING i.total_amount - COALESCE(SUM(ra.amount_applied), 0) > 0;
COMMENT ON VIEW customers.v_accounts_receivable_aging IS 'Antigüedad de saldos de cuentas por cobrar — insumo de tesorería.';

CREATE VIEW suppliers.v_accounts_payable_aging AS
SELECT
    pi.supplier_id, s.legal_name,
    pi.id AS purchase_invoice_id, pi.supplier_document_number, pi.total_amount,
    (CURRENT_DATE - pi.received_at::date) AS days_outstanding,
    CASE
        WHEN (CURRENT_DATE - pi.received_at::date) <= 30 THEN '0-30'
        WHEN (CURRENT_DATE - pi.received_at::date) <= 60 THEN '31-60'
        WHEN (CURRENT_DATE - pi.received_at::date) <= 90 THEN '61-90'
        ELSE '90+'
    END AS aging_bucket
FROM purchases.purchase_invoices pi
JOIN suppliers.suppliers s ON s.id = pi.supplier_id
WHERE pi.deleted_at IS NULL;
COMMENT ON VIEW suppliers.v_accounts_payable_aging IS 'Antigüedad de saldos de cuentas por pagar — insumo de tesorería.';

-- -----------------------------------------------------------------------------
-- 5. Existencias disponibles (disponible = a mano - reservado)
-- -----------------------------------------------------------------------------

CREATE VIEW inventory.v_available_stock AS
SELECT product_id, warehouse_id, company_id, branch_id,
       quantity_on_hand, quantity_reserved,
       (quantity_on_hand - quantity_reserved) AS quantity_available
FROM inventory.stock
WHERE deleted_at IS NULL;
COMMENT ON VIEW inventory.v_available_stock IS 'Disponible = a mano - reservado. Usada por sales al verificar disponibilidad antes de confirmar un pedido.';

-- =============================================================================
-- FIN 24_views.sql
-- =============================================================================
