-- =============================================================================
-- GORAZUS ERP — 18_assets.sql
-- Módulo: Assets
-- Schema: assets
-- Depende de: 01_core.sql, 08_purchases.sql, 11_accounting.sql, 13_hr.sql
-- Documentación funcional: docs/database/logico/18-assets.md
-- Cierra la FK diferida de hr.employee_asset_assignments.asset_id.
-- Patrón universal de 18 columnas: ver 01_core.sql (encabezado).
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS assets;

CREATE TABLE assets.depreciation_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    code TEXT NOT NULL CHECK (code IN ('straight_line', 'declining_balance'))
);
COMMENT ON TABLE assets.depreciation_methods IS 'Línea recta, saldos decrecientes, etc.';

CREATE TABLE assets.asset_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    name TEXT NOT NULL, default_depreciation_method_id UUID REFERENCES assets.depreciation_methods(id), default_useful_life_months INTEGER
);
COMMENT ON TABLE assets.asset_categories IS 'Categoría con método y vida útil por defecto.';

CREATE TABLE assets.fixed_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    name TEXT NOT NULL, category_id UUID NOT NULL REFERENCES assets.asset_categories(id), source_purchase_invoice_line_id UUID REFERENCES purchases.purchase_invoice_lines(id),
    acquisition_cost NUMERIC(18,4) NOT NULL, acquisition_date DATE NOT NULL, current_custodian_user_id UUID REFERENCES core.users(id)
);
COMMENT ON TABLE assets.fixed_assets IS 'Bien de uso.';

ALTER TABLE hr.employee_asset_assignments ADD CONSTRAINT fk_hr_employee_assets_asset FOREIGN KEY (asset_id) REFERENCES assets.fixed_assets(id);

CREATE TABLE assets.asset_depreciation_entries (
    id UUID NOT NULL DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    asset_id UUID NOT NULL REFERENCES assets.fixed_assets(id), fiscal_period_id UUID NOT NULL REFERENCES accounting.fiscal_periods(id), amount NUMERIC(18,4) NOT NULL,
    -- PK/UNIQUE deben incluir la columna de partición (created_at)
    PRIMARY KEY (id, created_at), UNIQUE (local_id, created_at)
) PARTITION BY RANGE (created_at);
COMMENT ON TABLE assets.asset_depreciation_entries IS 'Depreciación calculada por período. Particionada mensualmente, ver 29_partitioning.sql — ver docs/architecture/37-modulo-assets.md §3 para el razonamiento (tabla de hechos append-only, crece con activos×períodos).';
-- incluye created_at (columna de partición) — obligatorio para UNIQUE en tabla particionada
CREATE UNIQUE INDEX uq_assets_depreciation_entries_period ON assets.asset_depreciation_entries (asset_id, fiscal_period_id, created_at) WHERE deleted_at IS NULL;

CREATE TABLE assets.asset_maintenance_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    code TEXT NOT NULL CHECK (code IN ('preventive', 'corrective'))
);
COMMENT ON TABLE assets.asset_maintenance_types IS 'Catálogo (preventivo, correctivo).';

CREATE TABLE assets.asset_maintenances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    asset_id UUID NOT NULL REFERENCES assets.fixed_assets(id), maintenance_type_id UUID NOT NULL REFERENCES assets.asset_maintenance_types(id), cost NUMERIC(18,4)
);
COMMENT ON TABLE assets.asset_maintenances IS 'Mantenimiento realizado sobre un activo propio.';

CREATE TABLE assets.asset_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    asset_id UUID NOT NULL REFERENCES assets.fixed_assets(id), from_branch_id UUID REFERENCES core.branches(id), to_branch_id UUID REFERENCES core.branches(id)
);
COMMENT ON TABLE assets.asset_transfers IS 'Cambio de ubicación/responsable.';

CREATE TABLE assets.asset_custodian_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    asset_id UUID NOT NULL REFERENCES assets.fixed_assets(id), custodian_user_id UUID NOT NULL REFERENCES core.users(id)
);
COMMENT ON TABLE assets.asset_custodian_history IS 'Historial de responsables asignados.';

CREATE TABLE assets.asset_revaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    asset_id UUID NOT NULL REFERENCES assets.fixed_assets(id), new_value NUMERIC(18,4) NOT NULL, approved_by_user_id UUID NOT NULL REFERENCES core.users(id)
);
COMMENT ON TABLE assets.asset_revaluations IS 'Ajuste de valor contable.';

CREATE TABLE assets.asset_disposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    asset_id UUID NOT NULL REFERENCES assets.fixed_assets(id), disposal_type TEXT NOT NULL CHECK (disposal_type IN ('sale', 'donation', 'scrap')), residual_value NUMERIC(18,4) NOT NULL DEFAULT 0
);
COMMENT ON TABLE assets.asset_disposals IS 'Baja por venta, donación o desecho, con valor residual.';

-- =============================================================================
-- FIN 18_assets.sql — 10 tablas + cierre de 1 FK diferida.
-- =============================================================================
