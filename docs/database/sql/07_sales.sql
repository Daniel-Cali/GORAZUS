-- =============================================================================
-- GORAZUS ERP — 07_sales.sql
-- Módulo: Sales
-- Schema: sales
-- Depende de: 01_core.sql, 03_customers.sql, 05_products.sql, 06_inventory.sql
-- Documentación funcional: docs/database/logico/07-sales.md
-- No existe pos_invoices separada de invoices (canal, no entidad nueva) ni
-- sales_reservations separada de sales_orders (estado 'reserved').
-- Patrón universal de 18 columnas: ver 01_core.sql (encabezado).
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS sales;

-- ---- Fuerza de ventas ----

CREATE TABLE sales.sales_territories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    name TEXT NOT NULL
);
COMMENT ON TABLE sales.sales_territories IS 'Zona/territorio de venta.';

CREATE TABLE sales.salespeople (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    user_id UUID REFERENCES core.users(id), employee_id UUID, territory_id UUID REFERENCES sales.sales_territories(id)
);
COMMENT ON TABLE sales.salespeople IS 'Vendedor. employee_id es referencia lógica a hr.employees (sin FK cruzada).';

ALTER TABLE customers.customers ADD CONSTRAINT fk_customers_salesperson FOREIGN KEY (assigned_salesperson_id) REFERENCES sales.salespeople(id);
ALTER TABLE customers.sales_routes ADD CONSTRAINT fk_customers_routes_salesperson FOREIGN KEY (assigned_salesperson_id) REFERENCES sales.salespeople(id);

CREATE TABLE sales.sales_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    name TEXT NOT NULL
);
COMMENT ON TABLE sales.sales_teams IS 'Equipo de ventas.';

CREATE TABLE sales.sales_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    team_id UUID NOT NULL REFERENCES sales.sales_teams(id), salesperson_id UUID NOT NULL REFERENCES sales.salespeople(id)
);
COMMENT ON TABLE sales.sales_team_members IS 'Miembros de un equipo (N:M).';
CREATE UNIQUE INDEX uq_sales_team_members ON sales.sales_team_members (team_id, salesperson_id) WHERE deleted_at IS NULL;

CREATE TABLE sales.commission_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    salesperson_id UUID REFERENCES sales.salespeople(id), commission_percentage NUMERIC(5,2) NOT NULL
);
COMMENT ON TABLE sales.commission_rules IS 'Regla de comisión por vendedor/línea/categoría.';

CREATE TABLE sales.sales_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    salesperson_id UUID REFERENCES sales.salespeople(id), team_id UUID REFERENCES sales.sales_teams(id),
    period_start DATE NOT NULL, period_end DATE NOT NULL, target_amount NUMERIC(18,4) NOT NULL
);
COMMENT ON TABLE sales.sales_targets IS 'Meta de venta por vendedor/equipo/período.';

-- ---- Cadena documental ----

CREATE TABLE sales.quote_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    code TEXT NOT NULL, is_final BOOLEAN NOT NULL DEFAULT false
);
COMMENT ON TABLE sales.quote_status IS 'Catálogo de estados de cotización.';

CREATE TABLE sales.quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID NOT NULL REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    document_number TEXT NOT NULL, customer_id UUID NOT NULL REFERENCES customers.customers(id), salesperson_id UUID REFERENCES sales.salespeople(id),
    status_id UUID NOT NULL REFERENCES sales.quote_status(id), currency_code CHAR(3) NOT NULL, total_amount NUMERIC(18,4) NOT NULL DEFAULT 0,
    valid_until DATE
);
COMMENT ON TABLE sales.quotes IS 'Cotización/presupuesto.';
CREATE UNIQUE INDEX uq_sales_quotes_number ON sales.quotes (branch_id, document_number) WHERE deleted_at IS NULL;

CREATE TABLE sales.quote_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    quote_id UUID NOT NULL REFERENCES sales.quotes(id), product_id UUID NOT NULL REFERENCES products.products(id),
    quantity NUMERIC(18,6) NOT NULL, unit_price NUMERIC(18,4) NOT NULL, discount_percentage NUMERIC(5,2) NOT NULL DEFAULT 0
);
COMMENT ON TABLE sales.quote_lines IS 'Línea de cotización.';

CREATE TABLE sales.quote_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    quote_id UUID NOT NULL REFERENCES sales.quotes(id), status_id UUID NOT NULL REFERENCES sales.quote_status(id)
);
COMMENT ON TABLE sales.quote_status_history IS 'Historial de transición de estado de la cotización.';

CREATE TABLE sales.sales_order_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    code TEXT NOT NULL, is_final BOOLEAN NOT NULL DEFAULT false  -- incluye 'reserved' (apartado) como valor de code, no tabla aparte
);
COMMENT ON TABLE sales.sales_order_status IS 'Catálogo de estados del pedido de venta.';

CREATE TABLE sales.sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID NOT NULL REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    document_number TEXT NOT NULL, customer_id UUID NOT NULL REFERENCES customers.customers(id), quote_id UUID REFERENCES sales.quotes(id),
    salesperson_id UUID REFERENCES sales.salespeople(id), status_id UUID NOT NULL REFERENCES sales.sales_order_status(id),
    sales_channel TEXT NOT NULL DEFAULT 'store' CHECK (sales_channel IN ('store', 'pos', 'ecommerce', 'phone', 'mobile')),
    currency_code CHAR(3) NOT NULL, total_amount NUMERIC(18,4) NOT NULL DEFAULT 0
);
COMMENT ON TABLE sales.sales_orders IS 'Pedido de venta (reserva stock). sales_channel=pos cubre lo que en otros sistemas sería una tabla pos_orders separada.';
CREATE UNIQUE INDEX uq_sales_orders_number ON sales.sales_orders (branch_id, document_number) WHERE deleted_at IS NULL;

CREATE TABLE sales.sales_order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    sales_order_id UUID NOT NULL REFERENCES sales.sales_orders(id), product_id UUID NOT NULL REFERENCES products.products(id),
    quantity NUMERIC(18,6) NOT NULL, unit_price NUMERIC(18,4) NOT NULL, discount_percentage NUMERIC(5,2) NOT NULL DEFAULT 0
);
COMMENT ON TABLE sales.sales_order_lines IS 'Línea de pedido.';

CREATE TABLE sales.sales_order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    sales_order_id UUID NOT NULL REFERENCES sales.sales_orders(id), status_id UUID NOT NULL REFERENCES sales.sales_order_status(id)
);
COMMENT ON TABLE sales.sales_order_status_history IS 'Historial de transición de estado del pedido.';

CREATE TABLE sales.delivery_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID NOT NULL REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    document_number TEXT NOT NULL, sales_order_id UUID NOT NULL REFERENCES sales.sales_orders(id)
);
COMMENT ON TABLE sales.delivery_notes IS 'Remito/nota de entrega.';
CREATE UNIQUE INDEX uq_sales_delivery_notes_number ON sales.delivery_notes (branch_id, document_number) WHERE deleted_at IS NULL;

CREATE TABLE sales.delivery_note_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    delivery_note_id UUID NOT NULL REFERENCES sales.delivery_notes(id), product_id UUID NOT NULL REFERENCES products.products(id), quantity NUMERIC(18,6) NOT NULL
);
COMMENT ON TABLE sales.delivery_note_lines IS 'Línea de remito.';

CREATE TABLE sales.invoice_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    code TEXT NOT NULL, is_final BOOLEAN NOT NULL DEFAULT false
);
COMMENT ON TABLE sales.invoice_status IS 'Catálogo de estados de factura.';

CREATE TABLE sales.invoices (
    id UUID NOT NULL DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID NOT NULL REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    document_number TEXT NOT NULL, fiscal_document_type_id UUID, customer_id UUID NOT NULL REFERENCES customers.customers(id),
    sales_order_id UUID REFERENCES sales.sales_orders(id), status_id UUID NOT NULL REFERENCES sales.invoice_status(id),
    sales_channel TEXT NOT NULL DEFAULT 'store' CHECK (sales_channel IN ('store', 'pos', 'ecommerce', 'phone', 'mobile')),
    currency_code CHAR(3) NOT NULL, subtotal_amount NUMERIC(18,4) NOT NULL DEFAULT 0, tax_amount NUMERIC(18,4) NOT NULL DEFAULT 0,
    total_amount NUMERIC(18,4) NOT NULL DEFAULT 0, issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- PK/UNIQUE deben incluir la columna de partición (issued_at)
    PRIMARY KEY (id, issued_at), UNIQUE (local_id, issued_at)
) PARTITION BY RANGE (issued_at);
COMMENT ON TABLE sales.invoices IS 'Factura de venta. Particionada anualmente. fiscal_document_type_id referencia configuration.fiscal_document_types (12_taxes.sql en adelante).';
-- incluye issued_at (columna de partición) — obligatorio para UNIQUE en tabla particionada
CREATE UNIQUE INDEX uq_sales_invoices_number ON sales.invoices (branch_id, document_number, issued_at) WHERE deleted_at IS NULL;

CREATE TABLE sales.invoice_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    invoice_id UUID NOT NULL, product_id UUID NOT NULL REFERENCES products.products(id), tax_id UUID,
    quantity NUMERIC(18,6) NOT NULL, unit_price NUMERIC(18,4) NOT NULL, discount_percentage NUMERIC(5,2) NOT NULL DEFAULT 0, line_total NUMERIC(18,4) NOT NULL
);
COMMENT ON TABLE sales.invoice_lines IS 'Línea de factura. tax_id referencia taxes.taxes (FK real agregada en 12_taxes.sql).';

CREATE TABLE sales.invoice_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    invoice_id UUID NOT NULL, status_id UUID NOT NULL REFERENCES sales.invoice_status(id)
);
COMMENT ON TABLE sales.invoice_status_history IS 'Historial de transición de estado de la factura.';

CREATE TABLE sales.electronic_invoice_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    invoice_id UUID NOT NULL, attempt_status TEXT NOT NULL CHECK (attempt_status IN ('sent', 'accepted', 'rejected')),
    provider_response TEXT, fiscal_folio TEXT
);
COMMENT ON TABLE sales.electronic_invoice_logs IS 'Cada intento de timbrado/envío fiscal de una factura.';

CREATE TABLE sales.credit_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID NOT NULL REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    document_number TEXT NOT NULL, invoice_id UUID NOT NULL, total_amount NUMERIC(18,4) NOT NULL, reason TEXT
);
COMMENT ON TABLE sales.credit_notes IS 'Nota de crédito.';
CREATE UNIQUE INDEX uq_sales_credit_notes_number ON sales.credit_notes (branch_id, document_number) WHERE deleted_at IS NULL;

CREATE TABLE sales.credit_note_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    credit_note_id UUID NOT NULL REFERENCES sales.credit_notes(id), product_id UUID NOT NULL REFERENCES products.products(id),
    quantity NUMERIC(18,6) NOT NULL, unit_price NUMERIC(18,4) NOT NULL
);
COMMENT ON TABLE sales.credit_note_lines IS 'Línea de NC.';

CREATE TABLE sales.debit_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID NOT NULL REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    document_number TEXT NOT NULL, invoice_id UUID NOT NULL, total_amount NUMERIC(18,4) NOT NULL, reason TEXT
);
COMMENT ON TABLE sales.debit_notes IS 'Nota de débito.';
CREATE UNIQUE INDEX uq_sales_debit_notes_number ON sales.debit_notes (branch_id, document_number) WHERE deleted_at IS NULL;

CREATE TABLE sales.debit_note_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    debit_note_id UUID NOT NULL REFERENCES sales.debit_notes(id), description TEXT NOT NULL, amount NUMERIC(18,4) NOT NULL
);
COMMENT ON TABLE sales.debit_note_lines IS 'Línea de ND.';

CREATE TABLE sales.commission_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    commission_rule_id UUID NOT NULL REFERENCES sales.commission_rules(id), invoice_id UUID NOT NULL, amount NUMERIC(18,4) NOT NULL
);
COMMENT ON TABLE sales.commission_entries IS 'Comisión devengada calculada por documento de venta.';

CREATE TABLE sales.receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    document_number TEXT NOT NULL, customer_id UUID NOT NULL REFERENCES customers.customers(id), total_amount NUMERIC(18,4) NOT NULL,
    payment_method_id UUID  -- FK real agregada en 21_configuration.sql
);
COMMENT ON TABLE sales.receipts IS 'Recibo de cobro. La allocation a facturas vive en receipt_allocations; el movimiento de dinero real vive en cash/banks.';

CREATE TABLE sales.receipt_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    receipt_id UUID NOT NULL REFERENCES sales.receipts(id), invoice_id UUID NOT NULL, amount_applied NUMERIC(18,4) NOT NULL
);
COMMENT ON TABLE sales.receipt_allocations IS 'Monto del recibo aplicado a cada factura (soporta pagos parciales/múltiples).';

CREATE TABLE sales.sales_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    invoice_id UUID NOT NULL, reason TEXT
);
COMMENT ON TABLE sales.sales_returns IS 'Devolución de venta.';

CREATE TABLE sales.sales_return_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    sales_return_id UUID NOT NULL REFERENCES sales.sales_returns(id), product_id UUID NOT NULL REFERENCES products.products(id), quantity NUMERIC(18,6) NOT NULL
);
COMMENT ON TABLE sales.sales_return_lines IS 'Línea de devolución.';

CREATE TABLE sales.warranties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    invoice_line_id UUID NOT NULL REFERENCES sales.invoice_lines(id), product_id UUID NOT NULL REFERENCES products.products(id),
    coverage_months INTEGER NOT NULL, expires_at DATE NOT NULL
);
COMMENT ON TABLE sales.warranties IS 'Garantía emitida sobre una línea de factura. Único módulo dueño — services solo referencia.';

CREATE TABLE sales.warranty_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    warranty_id UUID NOT NULL REFERENCES sales.warranties(id), claim_description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'approved', 'rejected', 'resolved'))
);
COMMENT ON TABLE sales.warranty_claims IS 'Reclamo de garantía (deriva a services.service_orders).';

-- ---- Promociones y precios especiales ----

CREATE TABLE sales.promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    name TEXT NOT NULL, starts_at DATE NOT NULL, ends_at DATE NOT NULL
);
COMMENT ON TABLE sales.promotions IS 'Promoción/oferta con vigencia.';

CREATE TABLE sales.promotion_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    promotion_id UUID NOT NULL REFERENCES sales.promotions(id), rule_type TEXT NOT NULL CHECK (rule_type IN ('volume', 'combo', 'buy_x_get_y')),
    product_id UUID REFERENCES products.products(id), min_quantity NUMERIC(18,6), discount_percentage NUMERIC(5,2)
);
COMMENT ON TABLE sales.promotion_rules IS 'Regla de aplicación de la promoción.';

CREATE TABLE sales.discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    product_category_id UUID REFERENCES products.product_categories(id), discount_percentage NUMERIC(5,2) NOT NULL
);
COMMENT ON TABLE sales.discounts IS 'Descuento general por producto/categoría (distinto del negociado por cliente en customers.customer_discounts).';

CREATE TABLE sales.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    code TEXT NOT NULL, discount_percentage NUMERIC(5,2), discount_amount NUMERIC(18,4), max_redemptions INTEGER, expires_at DATE
);
COMMENT ON TABLE sales.coupons IS 'Cupón de descuento con código único.';
CREATE UNIQUE INDEX uq_sales_coupons_code ON sales.coupons (company_id, code) WHERE deleted_at IS NULL;

CREATE TABLE sales.coupon_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    coupon_id UUID NOT NULL REFERENCES sales.coupons(id), invoice_id UUID NOT NULL
);
COMMENT ON TABLE sales.coupon_redemptions IS 'Uso de un cupón en una factura.';

-- ---- Fidelización, tarjetas de regalo y canal e-commerce ----

CREATE TABLE sales.loyalty_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    name TEXT NOT NULL, points_per_currency_unit NUMERIC(9,4) NOT NULL DEFAULT 1
);
COMMENT ON TABLE sales.loyalty_programs IS 'Programa de fidelización (regla de acumulación/canje).';

ALTER TABLE customers.customer_loyalty_accounts ADD CONSTRAINT fk_customers_loyalty_program FOREIGN KEY (loyalty_program_id) REFERENCES sales.loyalty_programs(id);

CREATE TABLE sales.loyalty_program_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    program_id UUID NOT NULL REFERENCES sales.loyalty_programs(id), code TEXT NOT NULL, min_points INTEGER NOT NULL
);
COMMENT ON TABLE sales.loyalty_program_tiers IS 'Nivel dentro de un programa (bronce/plata/oro) con beneficios.';

CREATE TABLE sales.loyalty_points_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    loyalty_account_id UUID NOT NULL REFERENCES customers.customer_loyalty_accounts(id), invoice_id UUID,
    points_delta INTEGER NOT NULL, transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'redeem', 'expire'))
);
COMMENT ON TABLE sales.loyalty_points_transactions IS 'Acumulación/canje de puntos de un cliente.';

CREATE TABLE sales.gift_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    code TEXT NOT NULL, initial_balance NUMERIC(18,4) NOT NULL, current_balance NUMERIC(18,4) NOT NULL, expires_at DATE
);
COMMENT ON TABLE sales.gift_cards IS 'Tarjeta de regalo emitida, con saldo.';
CREATE UNIQUE INDEX uq_sales_gift_cards_code ON sales.gift_cards (code) WHERE deleted_at IS NULL;

CREATE TABLE sales.gift_card_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    gift_card_id UUID NOT NULL REFERENCES sales.gift_cards(id), invoice_id UUID, amount_delta NUMERIC(18,4) NOT NULL
);
COMMENT ON TABLE sales.gift_card_transactions IS 'Carga/consumo de una tarjeta de regalo.';

CREATE TABLE sales.online_store_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    domain TEXT NOT NULL, payment_gateway_integration_id UUID REFERENCES core.integrations(id)
);
COMMENT ON TABLE sales.online_store_configs IS 'Configuración de un canal de venta e-commerce.';

CREATE TABLE sales.shopping_carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    customer_id UUID REFERENCES customers.customers(id), status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'abandoned', 'converted'))
);
COMMENT ON TABLE sales.shopping_carts IS 'Carrito de compra activo/abandonado (canal e-commerce).';

CREATE TABLE sales.shopping_cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    cart_id UUID NOT NULL REFERENCES sales.shopping_carts(id), product_id UUID NOT NULL REFERENCES products.products(id), quantity NUMERIC(18,6) NOT NULL
);
COMMENT ON TABLE sales.shopping_cart_items IS 'Línea de producto dentro de un carrito.';

-- ---- Apartados ----

CREATE TABLE sales.layaways (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    customer_id UUID NOT NULL REFERENCES customers.customers(id), total_amount NUMERIC(18,4) NOT NULL, balance_due NUMERIC(18,4) NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled'))
);
COMMENT ON TABLE sales.layaways IS 'Apartado: reserva de producto con pago diferido/parcial.';

CREATE TABLE sales.layaway_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    layaway_id UUID NOT NULL REFERENCES sales.layaways(id), product_id UUID NOT NULL REFERENCES products.products(id),
    quantity NUMERIC(18,6) NOT NULL, unit_price NUMERIC(18,4) NOT NULL
);
COMMENT ON TABLE sales.layaway_lines IS 'Línea de producto apartado.';

CREATE TABLE sales.layaway_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    layaway_id UUID NOT NULL REFERENCES sales.layaways(id), amount NUMERIC(18,4) NOT NULL
);
COMMENT ON TABLE sales.layaway_payments IS 'Pago parcial aplicado a un apartado.';

-- ---- Contratos, suscripciones y ventas recurrentes ----

CREATE TABLE sales.sales_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    customer_id UUID NOT NULL REFERENCES customers.customers(id), starts_at DATE NOT NULL, ends_at DATE
);
COMMENT ON TABLE sales.sales_contracts IS 'Contrato comercial de largo plazo.';

CREATE TABLE sales.sales_contract_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    contract_id UUID NOT NULL REFERENCES sales.sales_contracts(id), product_id UUID NOT NULL REFERENCES products.products(id), agreed_price NUMERIC(18,4) NOT NULL
);
COMMENT ON TABLE sales.sales_contract_lines IS 'Condiciones del contrato (producto/servicio, precio acordado).';

CREATE TABLE sales.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    customer_id UUID NOT NULL REFERENCES customers.customers(id), billing_frequency TEXT NOT NULL CHECK (billing_frequency IN ('monthly', 'quarterly', 'annual')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled'))
);
COMMENT ON TABLE sales.subscriptions IS 'Suscripción recurrente.';

CREATE TABLE sales.subscription_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    subscription_id UUID NOT NULL REFERENCES sales.subscriptions(id), product_id UUID NOT NULL REFERENCES products.products(id), unit_price NUMERIC(18,4) NOT NULL
);
COMMENT ON TABLE sales.subscription_lines IS 'Producto/servicio incluido en la suscripción.';

CREATE TABLE sales.subscription_billing_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    subscription_id UUID NOT NULL REFERENCES sales.subscriptions(id), period_start DATE NOT NULL, period_end DATE NOT NULL,
    invoice_id UUID
);
COMMENT ON TABLE sales.subscription_billing_cycles IS 'Ciclo de facturación de una suscripción (generado/pendiente).';

CREATE TABLE sales.recurring_sale_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    customer_id UUID NOT NULL REFERENCES customers.customers(id), frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'annual')),
    next_generation_date DATE NOT NULL
);
COMMENT ON TABLE sales.recurring_sale_templates IS 'Plantilla de facturación recurrente (no ligada a suscripción formal).';

CREATE TABLE sales.recurring_sale_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    template_id UUID NOT NULL REFERENCES sales.recurring_sale_templates(id), invoice_id UUID NOT NULL
);
COMMENT ON TABLE sales.recurring_sale_generations IS 'Registro de cada factura auto-generada desde una plantilla.';

-- =============================================================================
-- FIN 07_sales.sql — 54 tablas. El módulo más grande del sistema.
-- Notas de portabilidad: iguales a 01_core.sql + 06_inventory.sql (particionamiento).
-- =============================================================================
