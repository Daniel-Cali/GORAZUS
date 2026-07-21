-- =============================================================================
-- GORAZUS ERP — 04_suppliers.sql
-- Módulo: Suppliers
-- Schema: suppliers
-- Depende de: 01_core.sql
-- Documentación funcional: docs/database/logico/04-suppliers.md
-- Patrón universal de 18 columnas: ver 01_core.sql (encabezado).
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS suppliers;

CREATE TABLE suppliers.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id),
    company_id UUID NOT NULL REFERENCES core.companies(id),
    branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id),
    updated_by UUID REFERENCES core.users(id),
    deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1,
    row_version BIGINT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    legal_name TEXT NOT NULL,
    trade_name TEXT,
    tax_id TEXT NOT NULL,
    payment_terms_days INTEGER NOT NULL DEFAULT 0,
    is_blocked BOOLEAN NOT NULL DEFAULT false,
    block_reason TEXT
);
COMMENT ON TABLE suppliers.suppliers IS 'Maestro único de proveedores. purchases/banks lo referencian por ID, nunca lo duplican.';
CREATE UNIQUE INDEX uq_suppliers_suppliers_taxid ON suppliers.suppliers (company_id, tax_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_suppliers_suppliers_name_trgm ON suppliers.suppliers USING GIN (legal_name gin_trgm_ops) WHERE deleted_at IS NULL;

CREATE TABLE suppliers.supplier_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    supplier_id UUID NOT NULL REFERENCES suppliers.suppliers(id),
    full_name TEXT NOT NULL, email TEXT, phone TEXT, is_primary BOOLEAN NOT NULL DEFAULT false
);
COMMENT ON TABLE suppliers.supplier_contacts IS 'Persona de contacto del proveedor.';

CREATE TABLE suppliers.supplier_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    supplier_id UUID NOT NULL REFERENCES suppliers.suppliers(id),
    address_type TEXT NOT NULL CHECK (address_type IN ('billing', 'shipping', 'other')),
    line1 TEXT NOT NULL, line2 TEXT, municipality_id UUID, postal_code TEXT, is_default BOOLEAN NOT NULL DEFAULT false
);
COMMENT ON TABLE suppliers.supplier_addresses IS 'Dirección del proveedor.';

CREATE TABLE suppliers.supplier_bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    supplier_id UUID NOT NULL REFERENCES suppliers.suppliers(id),
    bank_name TEXT NOT NULL, encrypted_account_number TEXT NOT NULL
);
COMMENT ON TABLE suppliers.supplier_bank_accounts IS 'Cuenta bancaria del proveedor para transferencia de pago. Cifrada a nivel de columna.';

CREATE TABLE suppliers.supplier_credit_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    supplier_id UUID NOT NULL REFERENCES suppliers.suppliers(id),
    credit_limit NUMERIC(18,4), payment_terms_days INTEGER NOT NULL DEFAULT 0
);
COMMENT ON TABLE suppliers.supplier_credit_profiles IS 'Condiciones de crédito que el proveedor otorga a la empresa (1:1).';
CREATE UNIQUE INDEX uq_suppliers_credit_profiles ON suppliers.supplier_credit_profiles (supplier_id) WHERE deleted_at IS NULL;

CREATE TABLE suppliers.supplier_credit_limit_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    supplier_id UUID NOT NULL REFERENCES suppliers.suppliers(id),
    previous_limit NUMERIC(18,4), new_limit NUMERIC(18,4)
);
COMMENT ON TABLE suppliers.supplier_credit_limit_history IS 'Historial de cambios de condiciones de crédito.';

CREATE TABLE suppliers.supplier_withholding_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    supplier_id UUID NOT NULL REFERENCES suppliers.suppliers(id),
    withholding_rule_id UUID  -- FK real agregada en 12_taxes.sql
);
COMMENT ON TABLE suppliers.supplier_withholding_profiles IS 'Régimen de retención por defecto aplicado a este proveedor.';

CREATE TABLE suppliers.supplier_block_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    supplier_id UUID NOT NULL REFERENCES suppliers.suppliers(id),
    action TEXT NOT NULL CHECK (action IN ('blocked', 'unblocked')), reason TEXT
);
COMMENT ON TABLE suppliers.supplier_block_history IS 'Historial de bloqueo/desbloqueo, con motivo.';

CREATE TABLE suppliers.supplier_classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    name TEXT NOT NULL  -- bienes, servicios, importación
);
COMMENT ON TABLE suppliers.supplier_classifications IS 'Categoría de proveedor.';

ALTER TABLE suppliers.suppliers ADD COLUMN classification_id UUID REFERENCES suppliers.supplier_classifications(id);

CREATE TABLE suppliers.supplier_evaluation_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    name TEXT NOT NULL, weight_percentage NUMERIC(5,2) NOT NULL CHECK (weight_percentage BETWEEN 0 AND 100)
);
COMMENT ON TABLE suppliers.supplier_evaluation_criteria IS 'Criterio de evaluación (calidad, plazo, precio) con ponderación.';

CREATE TABLE suppliers.supplier_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    supplier_id UUID NOT NULL REFERENCES suppliers.suppliers(id),
    evaluated_by_user_id UUID NOT NULL REFERENCES core.users(id),
    evaluation_date DATE NOT NULL DEFAULT current_date, overall_score NUMERIC(5,2)
);
COMMENT ON TABLE suppliers.supplier_evaluations IS 'Evaluación periódica de un proveedor.';

CREATE TABLE suppliers.supplier_evaluation_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    evaluation_id UUID NOT NULL REFERENCES suppliers.supplier_evaluations(id),
    criteria_id UUID NOT NULL REFERENCES suppliers.supplier_evaluation_criteria(id),
    score NUMERIC(5,2) NOT NULL
);
COMMENT ON TABLE suppliers.supplier_evaluation_scores IS 'Puntaje por criterio dentro de una evaluación.';

CREATE TABLE suppliers.supplier_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    supplier_id UUID NOT NULL REFERENCES suppliers.suppliers(id),
    event_description TEXT NOT NULL, occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE suppliers.supplier_history IS 'Línea de tiempo de eventos clave del proveedor.';

-- =============================================================================
-- FIN 04_suppliers.sql — 13 tablas.
-- Notas de portabilidad: iguales a las de 01_core.sql.
-- =============================================================================
