-- =============================================================================
-- GORAZUS ERP — 12_taxes.sql
-- Módulo: Taxes
-- Schema: taxes
-- Depende de: 01_core.sql. Cierra las FK diferidas de tax_id/withholding_rule_id
-- abiertas en 05_products.sql, 07_sales.sql, 08_purchases.sql, 04_suppliers.sql.
-- A su vez, tax_jurisdictions.country_id y tax_rules.fiscal_regime_id quedan
-- SIN FK inline acá (configuration corre después, 21_configuration.sql) —
-- ambas se cierran ahí.
-- Documentación funcional: docs/database/logico/12-taxes.md
-- Libro de IVA ventas/compras = vista (24_views.sql), no tabla base.
-- Patrón universal de 18 columnas: ver 01_core.sql (encabezado).
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS taxes;

CREATE TABLE taxes.tax_jurisdictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    country_id UUID NOT NULL, name TEXT NOT NULL  -- FK real hacia configuration.countries agregada en 21_configuration.sql
);
COMMENT ON TABLE taxes.tax_jurisdictions IS 'Jurisdicción fiscal (país, estado/provincia) que define el régimen.';

CREATE TABLE taxes.taxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    code TEXT NOT NULL, jurisdiction_id UUID NOT NULL REFERENCES taxes.tax_jurisdictions(id), tax_kind TEXT NOT NULL CHECK (tax_kind IN ('sales_tax', 'income_tax', 'other'))
);
COMMENT ON TABLE taxes.taxes IS 'Impuesto (ITBIS, IVA, ISR, impuesto local específico).';

CREATE TABLE taxes.tax_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    tax_id UUID NOT NULL REFERENCES taxes.taxes(id), language_code TEXT NOT NULL, name TEXT NOT NULL
);
COMMENT ON TABLE taxes.tax_translations IS 'Nombre del impuesto por idioma.';
CREATE UNIQUE INDEX uq_taxes_translations ON taxes.tax_translations (tax_id, language_code) WHERE deleted_at IS NULL;

CREATE TABLE taxes.tax_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    tax_id UUID NOT NULL REFERENCES taxes.taxes(id), rate_percentage NUMERIC(6,3) NOT NULL, effective_from DATE NOT NULL, effective_to DATE
);
COMMENT ON TABLE taxes.tax_rates IS 'Tasa vigente de un impuesto, con vigencia desde/hasta (histórico).';

CREATE TABLE taxes.tax_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    tax_id UUID NOT NULL REFERENCES taxes.taxes(id), product_category_id UUID REFERENCES products.product_categories(id),
    fiscal_regime_id UUID  -- FK real hacia configuration.fiscal_regimes agregada en 21_configuration.sql (config. corre después de taxes)
);
COMMENT ON TABLE taxes.tax_rules IS 'Regla de aplicabilidad (qué categoría de producto/tipo de cliente aplica). fiscal_regime_id agregado por docs/architecture/46-modulo-taxes.md §1 — reconcilia configuration.fiscal_regimes (antes desconectado del schema taxes) para reglas que varían según el régimen tributario de la empresa (p. ej. tasa distinta o exenta para régimen exportador), no solo por categoría de producto. Nullable: una regla sin régimen especificado aplica a cualquier régimen.';

CREATE TABLE taxes.withholding_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    jurisdiction_id UUID NOT NULL REFERENCES taxes.tax_jurisdictions(id), name TEXT NOT NULL, rate_percentage NUMERIC(6,3) NOT NULL
);
COMMENT ON TABLE taxes.withholding_rules IS 'Regla de retención (ISR, IVA retenido) por tipo de proveedor/servicio.';

ALTER TABLE suppliers.supplier_withholding_profiles ADD CONSTRAINT fk_suppliers_withholding_rule FOREIGN KEY (withholding_rule_id) REFERENCES taxes.withholding_rules(id);
ALTER TABLE purchases.purchase_withholdings ADD CONSTRAINT fk_purchases_withholding_rule FOREIGN KEY (withholding_rule_id) REFERENCES taxes.withholding_rules(id);

CREATE TABLE taxes.withholding_certificates (
    id UUID NOT NULL DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    withholding_rule_id UUID NOT NULL REFERENCES taxes.withholding_rules(id), source_module TEXT NOT NULL, source_entity_id UUID NOT NULL, amount NUMERIC(18,4) NOT NULL,
    -- PK/UNIQUE deben incluir la columna de partición (created_at)
    PRIMARY KEY (id, created_at), UNIQUE (local_id, created_at)
) PARTITION BY RANGE (created_at);
COMMENT ON TABLE taxes.withholding_certificates IS 'Comprobante de retención emitido/recibido (polimórfico). Particionada mensualmente, ver 29_partitioning.sql — ver docs/architecture/46-modulo-taxes.md §10 (tabla de hechos append-only, un certificado por pago/factura retenida).';

CREATE TABLE taxes.tax_exemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    tax_id UUID NOT NULL REFERENCES taxes.taxes(id), customer_id UUID REFERENCES customers.customers(id), expires_at DATE
);
COMMENT ON TABLE taxes.tax_exemptions IS 'Exención aplicable a un cliente/producto.';

CREATE TABLE taxes.tax_exemption_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    exemption_id UUID NOT NULL REFERENCES taxes.tax_exemptions(id), document_id UUID NOT NULL REFERENCES core.documents(id)
);
COMMENT ON TABLE taxes.tax_exemption_certificates IS 'Certificado que respalda la exención.';

CREATE TABLE taxes.tax_perceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    jurisdiction_id UUID NOT NULL REFERENCES taxes.tax_jurisdictions(id), name TEXT NOT NULL
);
COMMENT ON TABLE taxes.tax_perceptions IS 'Percepción aplicable (régimen específico de algunos países).';

CREATE TABLE taxes.tax_perception_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    perception_id UUID NOT NULL REFERENCES taxes.tax_perceptions(id), rate_percentage NUMERIC(6,3) NOT NULL
);
COMMENT ON TABLE taxes.tax_perception_rules IS 'Regla de cálculo de la percepción.';

CREATE TABLE taxes.tax_declarations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    fiscal_period_id UUID NOT NULL REFERENCES accounting.fiscal_periods(id), filed_at TIMESTAMPTZ, total_amount NUMERIC(18,4) NOT NULL
);
COMMENT ON TABLE taxes.tax_declarations IS 'Declaración periódica presentada ante la autoridad fiscal (congelada).';

CREATE TABLE taxes.tax_declaration_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    declaration_id UUID NOT NULL REFERENCES taxes.tax_declarations(id), tax_id UUID NOT NULL REFERENCES taxes.taxes(id), amount NUMERIC(18,4) NOT NULL
);
COMMENT ON TABLE taxes.tax_declaration_lines IS 'Detalle de la declaración.';

-- Cierre de FKs diferidas hacia taxes.taxes / taxes.taxes(id)
ALTER TABLE products.product_tax_profiles ADD CONSTRAINT fk_products_tax FOREIGN KEY (tax_id) REFERENCES taxes.taxes(id);
ALTER TABLE sales.invoice_lines ADD CONSTRAINT fk_sales_invoice_lines_tax FOREIGN KEY (tax_id) REFERENCES taxes.taxes(id);
ALTER TABLE purchases.purchase_invoice_lines ADD CONSTRAINT fk_purchases_invoice_lines_tax FOREIGN KEY (tax_id) REFERENCES taxes.taxes(id);

-- =============================================================================
-- FIN 12_taxes.sql — 13 tablas + cierre de 5 FKs diferidas.
-- =============================================================================
