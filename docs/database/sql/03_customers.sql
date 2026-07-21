-- =============================================================================
-- GORAZUS ERP — 03_customers.sql
-- Módulo: Customers
-- Schema: customers
-- Depende de: 01_core.sql. FK hacia sales.salespeople y sales.loyalty_programs
-- son IDs sueltos (sin FK real) hasta que 07_sales.sql exista — ver
-- docs/architecture/06-comunicacion-entre-modulos.md (no hay FK entre schemas
-- de módulos de negocio pares).
-- Documentación funcional: docs/database/logico/03-customers.md
-- Patrón universal de 18 columnas: ver 01_core.sql (encabezado).
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS customers;

CREATE TABLE customers.customers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID NOT NULL REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    legal_name              TEXT NOT NULL,
    trade_name               TEXT,
    tax_id                     TEXT NOT NULL,
    tax_regime                   TEXT,
    preferred_currency_code        CHAR(3) NOT NULL,
    assigned_salesperson_id           UUID,  -- referencia lógica a sales.salespeople.id, sin FK cruzada
    is_blocked                          BOOLEAN NOT NULL DEFAULT false,
    block_reason                          TEXT
);
COMMENT ON TABLE customers.customers IS 'Maestro único de clientes de la empresa. Único módulo autorizado a escribir esta entidad — sales/crm/pos la referencian por ID.';
CREATE UNIQUE INDEX uq_customers_customers_taxid ON customers.customers (company_id, tax_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_customers_name_trgm ON customers.customers USING GIN (legal_name gin_trgm_ops) WHERE deleted_at IS NULL;

CREATE TABLE customers.customer_contacts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID NOT NULL REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    customer_id     UUID NOT NULL REFERENCES customers.customers(id),
    full_name       TEXT NOT NULL,
    job_title       TEXT,
    email           TEXT,
    phone           TEXT,
    is_primary      BOOLEAN NOT NULL DEFAULT false
);
COMMENT ON TABLE customers.customer_contacts IS 'Persona de contacto dentro de una cuenta cliente.';

CREATE TABLE customers.customer_addresses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID NOT NULL REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    customer_id     UUID NOT NULL REFERENCES customers.customers(id),
    address_type    TEXT NOT NULL CHECK (address_type IN ('billing', 'shipping', 'other')),
    line1           TEXT NOT NULL,
    line2           TEXT,
    municipality_id UUID,  -- FK real agregada en 21_configuration.sql
    postal_code     TEXT,
    is_default      BOOLEAN NOT NULL DEFAULT false
);
COMMENT ON TABLE customers.customer_addresses IS 'Dirección de facturación/entrega del cliente.';

CREATE TABLE customers.customer_bank_accounts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID NOT NULL REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    customer_id           UUID NOT NULL REFERENCES customers.customers(id),
    bank_name               TEXT NOT NULL,
    encrypted_account_number TEXT NOT NULL  -- cifrado con pgcrypto, ver 06-estrategia-seguridad.md §3
);
COMMENT ON TABLE customers.customer_bank_accounts IS 'Cuenta bancaria del cliente para débito directo/reembolsos. account_number cifrado a nivel de columna.';

CREATE TABLE customers.customer_references (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID NOT NULL REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    customer_id     UUID NOT NULL REFERENCES customers.customers(id),
    reference_type  TEXT NOT NULL CHECK (reference_type IN ('commercial', 'personal')),
    name            TEXT NOT NULL,
    phone           TEXT
);
COMMENT ON TABLE customers.customer_references IS 'Referencia comercial/personal para evaluación crediticia.';

CREATE TABLE customers.customer_credit_profiles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID NOT NULL REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    customer_id     UUID NOT NULL REFERENCES customers.customers(id),
    credit_limit    NUMERIC(18,4) NOT NULL DEFAULT 0,
    payment_terms_days INTEGER NOT NULL DEFAULT 0,
    billing_cutoff_day    SMALLINT
);
COMMENT ON TABLE customers.customer_credit_profiles IS 'Límite de crédito vigente, condición de pago, día de corte (1:1 con customers).';
CREATE UNIQUE INDEX uq_customers_credit_profiles ON customers.customer_credit_profiles (customer_id) WHERE deleted_at IS NULL;

CREATE TABLE customers.customer_credit_limit_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID NOT NULL REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    customer_id     UUID NOT NULL REFERENCES customers.customers(id),
    previous_limit  NUMERIC(18,4) NOT NULL,
    new_limit       NUMERIC(18,4) NOT NULL,
    approved_by_user_id UUID REFERENCES core.users(id)
);
COMMENT ON TABLE customers.customer_credit_limit_history IS 'Historial de cambios de límite de crédito, con aprobador.';

CREATE TABLE customers.customer_statements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID NOT NULL REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    customer_id     UUID NOT NULL REFERENCES customers.customers(id),
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,
    closing_balance NUMERIC(18,4) NOT NULL,
    snapshot_data   JSONB NOT NULL  -- detalle congelado de movimientos, valor probatorio
);
COMMENT ON TABLE customers.customer_statements IS 'Snapshot generado de estado de cuenta — valor probatorio/legal, no se recalcula retroactivamente.';

CREATE TABLE customers.customer_block_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID NOT NULL REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    customer_id     UUID NOT NULL REFERENCES customers.customers(id),
    action          TEXT NOT NULL CHECK (action IN ('blocked', 'unblocked')),
    reason          TEXT
);
COMMENT ON TABLE customers.customer_block_history IS 'Historial de bloqueo/desbloqueo comercial, con motivo.';

CREATE TABLE customers.customer_classifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID NOT NULL REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    name            TEXT NOT NULL  -- p. ej. A/B/C de riesgo crediticio
);
COMMENT ON TABLE customers.customer_classifications IS 'Clasificación de riesgo/crédito.';

CREATE TABLE customers.customer_categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID NOT NULL REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    name            TEXT NOT NULL  -- minorista, mayorista, gobierno
);
COMMENT ON TABLE customers.customer_categories IS 'Segmento de negocio del cliente.';

ALTER TABLE customers.customers ADD COLUMN classification_id UUID REFERENCES customers.customer_classifications(id);
ALTER TABLE customers.customers ADD COLUMN category_id UUID REFERENCES customers.customer_categories(id);

CREATE TABLE customers.customer_discounts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID NOT NULL REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    customer_id     UUID NOT NULL REFERENCES customers.customers(id),
    discount_percentage NUMERIC(5,2) NOT NULL CHECK (discount_percentage BETWEEN 0 AND 100),
    product_category_id  UUID  -- referencia lógica a products.product_categories.id
);
COMMENT ON TABLE customers.customer_discounts IS 'Regla de descuento específica de un cliente.';

CREATE TABLE customers.customer_price_lists (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID NOT NULL REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    customer_id     UUID NOT NULL REFERENCES customers.customers(id),
    price_list_id   UUID NOT NULL  -- FK real agregada en 21_configuration.sql
);
COMMENT ON TABLE customers.customer_price_lists IS 'Lista de precios asignada a un cliente.';
CREATE UNIQUE INDEX uq_customers_price_lists ON customers.customer_price_lists (customer_id) WHERE deleted_at IS NULL;

CREATE TABLE customers.customer_loyalty_accounts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID NOT NULL REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    customer_id     UUID NOT NULL REFERENCES customers.customers(id),
    loyalty_program_id UUID,  -- referencia lógica a sales.loyalty_programs.id
    points_balance     INTEGER NOT NULL DEFAULT 0,
    tier_code             TEXT
);
COMMENT ON TABLE customers.customer_loyalty_accounts IS 'Cuenta de puntos/fidelización de un cliente (1:1).';
CREATE UNIQUE INDEX uq_customers_loyalty_accounts ON customers.customer_loyalty_accounts (customer_id) WHERE deleted_at IS NULL;

CREATE TABLE customers.customer_wishlist_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID NOT NULL REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    customer_id     UUID NOT NULL REFERENCES customers.customers(id),
    product_id      UUID NOT NULL  -- referencia lógica a products.products.id
);
COMMENT ON TABLE customers.customer_wishlist_items IS 'Producto marcado como deseado por el cliente (canal e-commerce).';

CREATE TABLE customers.sales_routes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID NOT NULL REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    name            TEXT NOT NULL,
    assigned_salesperson_id UUID  -- referencia lógica a sales.salespeople.id
);
COMMENT ON TABLE customers.sales_routes IS 'Ruta geográfica de visita a clientes.';

CREATE TABLE customers.sales_route_customers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID NOT NULL REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    route_id        UUID NOT NULL REFERENCES customers.sales_routes(id),
    customer_id     UUID NOT NULL REFERENCES customers.customers(id),
    visit_order     SMALLINT
);
COMMENT ON TABLE customers.sales_route_customers IS 'Clientes asignados a una ruta (N:M, con orden de visita).';
CREATE UNIQUE INDEX uq_customers_route_customers ON customers.sales_route_customers (route_id, customer_id) WHERE deleted_at IS NULL;

CREATE TABLE customers.customer_visits (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID NOT NULL REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    customer_id     UUID NOT NULL REFERENCES customers.customers(id),
    route_id        UUID REFERENCES customers.sales_routes(id),
    visited_by_user_id UUID NOT NULL REFERENCES core.users(id),
    visited_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    latitude                NUMERIC(9,6),
    longitude                 NUMERIC(9,6),
    outcome_notes                TEXT
);
COMMENT ON TABLE customers.customer_visits IS 'Registro de una visita realizada (geolocalización, resultado).';

-- =============================================================================
-- FIN 03_customers.sql — 18 tablas.
-- Notas de portabilidad: iguales a las de 01_core.sql.
-- =============================================================================
