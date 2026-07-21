-- =============================================================================
-- GORAZUS ERP — 21_configuration.sql
-- Módulo: Configuration
-- Schema: configuration
-- Depende de: 01_core.sql. Cierra las últimas FKs diferidas de módulos
-- anteriores (municipality_id, price_list_id, payment_method_id, bank_id,
-- tax_jurisdictions.country_id).
-- Documentación funcional: docs/database/logico/21-configuration.md
-- Último archivo de dominio — de acá en adelante (22-30) son archivos
-- transversales que operan sobre las 498 tablas ya creadas.
-- Patrón universal de 18 columnas: ver 01_core.sql (encabezado).
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS configuration;

CREATE TABLE configuration.currencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    iso_code CHAR(3) NOT NULL, symbol TEXT, decimal_places SMALLINT NOT NULL DEFAULT 2
);
COMMENT ON TABLE configuration.currencies IS 'Catálogo ISO 4217 + monedas custom.';
CREATE UNIQUE INDEX uq_configuration_currencies_iso ON configuration.currencies (iso_code) WHERE deleted_at IS NULL;

CREATE TABLE configuration.currency_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    currency_id UUID NOT NULL REFERENCES configuration.currencies(id), language_code TEXT NOT NULL, name TEXT NOT NULL
);
COMMENT ON TABLE configuration.currency_translations IS 'Nombre de la moneda por idioma.';
CREATE UNIQUE INDEX uq_configuration_currency_translations ON configuration.currency_translations (currency_id, language_code) WHERE deleted_at IS NULL;

CREATE TABLE configuration.exchange_rate_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    code TEXT NOT NULL  -- oficial, compra, venta, paralela
);
COMMENT ON TABLE configuration.exchange_rate_types IS 'Tipo de cotización cuando un país tiene más de una tasa oficial.';

CREATE TABLE configuration.exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    from_currency_id UUID NOT NULL REFERENCES configuration.currencies(id), to_currency_id UUID NOT NULL REFERENCES configuration.currencies(id),
    rate_type_id UUID REFERENCES configuration.exchange_rate_types(id), rate NUMERIC(18,6) NOT NULL, rate_date DATE NOT NULL
);
COMMENT ON TABLE configuration.exchange_rates IS 'Cotización diaria por par de monedas.';
CREATE UNIQUE INDEX uq_configuration_exchange_rates ON configuration.exchange_rates (from_currency_id, to_currency_id, rate_type_id, rate_date) WHERE deleted_at IS NULL;

CREATE TABLE configuration.countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    iso_code CHAR(2) NOT NULL
);
COMMENT ON TABLE configuration.countries IS 'Catálogo ISO 3166.';
CREATE UNIQUE INDEX uq_configuration_countries_iso ON configuration.countries (iso_code) WHERE deleted_at IS NULL;

ALTER TABLE taxes.tax_jurisdictions ADD CONSTRAINT fk_taxes_jurisdictions_country FOREIGN KEY (country_id) REFERENCES configuration.countries(id);

CREATE TABLE configuration.country_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    country_id UUID NOT NULL REFERENCES configuration.countries(id), language_code TEXT NOT NULL, name TEXT NOT NULL
);
COMMENT ON TABLE configuration.country_translations IS 'Nombre del país por idioma.';
CREATE UNIQUE INDEX uq_configuration_country_translations ON configuration.country_translations (country_id, language_code) WHERE deleted_at IS NULL;

CREATE TABLE configuration.state_provinces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    country_id UUID NOT NULL REFERENCES configuration.countries(id), name TEXT NOT NULL
);
COMMENT ON TABLE configuration.state_provinces IS 'Estado/provincia/departamento.';

CREATE TABLE configuration.state_province_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    state_province_id UUID NOT NULL REFERENCES configuration.state_provinces(id), language_code TEXT NOT NULL, name TEXT NOT NULL
);
COMMENT ON TABLE configuration.state_province_translations IS 'Nombre por idioma.';

CREATE TABLE configuration.municipalities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    state_province_id UUID NOT NULL REFERENCES configuration.state_provinces(id), name TEXT NOT NULL
);
COMMENT ON TABLE configuration.municipalities IS 'Municipio/ciudad.';

ALTER TABLE customers.customer_addresses ADD CONSTRAINT fk_customers_addresses_municipality FOREIGN KEY (municipality_id) REFERENCES configuration.municipalities(id);
ALTER TABLE suppliers.supplier_addresses ADD CONSTRAINT fk_suppliers_addresses_municipality FOREIGN KEY (municipality_id) REFERENCES configuration.municipalities(id);

CREATE TABLE configuration.sectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    municipality_id UUID NOT NULL REFERENCES configuration.municipalities(id), name TEXT NOT NULL
);
COMMENT ON TABLE configuration.sectors IS 'Sector/barrio/zona (nivel más fino, usado en rutas de venta).';

CREATE TABLE configuration.payment_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    code TEXT NOT NULL CHECK (code IN ('cash', 'check', 'transfer', 'card', 'credit'))
);
COMMENT ON TABLE configuration.payment_forms IS 'Categoría amplia de forma de pago.';

CREATE TABLE configuration.banks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    name TEXT NOT NULL, swift_code TEXT
);
COMMENT ON TABLE configuration.banks IS 'Catálogo de entidades financieras del mercado.';

ALTER TABLE banks.bank_accounts ADD CONSTRAINT fk_banks_accounts_bank FOREIGN KEY (bank_id) REFERENCES configuration.banks(id);

CREATE TABLE configuration.payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    payment_form_id UUID NOT NULL REFERENCES configuration.payment_forms(id), bank_account_id UUID REFERENCES banks.bank_accounts(id), name TEXT NOT NULL
);
COMMENT ON TABLE configuration.payment_methods IS 'Instrumento específico habilitado para operar.';

ALTER TABLE sales.receipts ADD CONSTRAINT fk_sales_receipts_payment_method FOREIGN KEY (payment_method_id) REFERENCES configuration.payment_methods(id);

CREATE TABLE configuration.numbering_series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID NOT NULL REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    document_type TEXT NOT NULL  -- 'sales.invoice', 'purchases.purchase_order', etc.
);
COMMENT ON TABLE configuration.numbering_series IS 'Serie de numeración por tipo de comprobante, empresa y sucursal.';

CREATE TABLE configuration.document_number_formats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    series_id UUID NOT NULL REFERENCES configuration.numbering_series(id), prefix TEXT, number_length SMALLINT NOT NULL DEFAULT 8, suffix TEXT
);
COMMENT ON TABLE configuration.document_number_formats IS 'Patrón de formato de una serie.';

CREATE TABLE configuration.correlatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    series_id UUID NOT NULL REFERENCES configuration.numbering_series(id), next_number BIGINT NOT NULL DEFAULT 1
);
COMMENT ON TABLE configuration.correlatives IS 'Contador vigente de una serie (1:1). Lock PESIMISTA (SELECT...FOR UPDATE en fn_get_next_correlative, ver 25_functions.sql) para evitar números duplicados bajo concurrencia — deliberadamente distinto del optimistic locking vía row_version que usa el resto del modelo (ver 01-modelo-conceptual.md §1.1 y 14-modulo-core.md §10): un folio fiscal duplicado es un problema legal real, no uno recuperable con reintento.';
CREATE UNIQUE INDEX uq_configuration_correlatives_series ON configuration.correlatives (series_id) WHERE deleted_at IS NULL;

CREATE TABLE configuration.price_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    name TEXT NOT NULL, currency_id UUID NOT NULL REFERENCES configuration.currencies(id)
);
COMMENT ON TABLE configuration.price_lists IS 'Lista de precios (estructura general — consumida por sales/customers/crm).';

ALTER TABLE customers.customer_price_lists ADD CONSTRAINT fk_customers_price_lists_list FOREIGN KEY (price_list_id) REFERENCES configuration.price_lists(id);

CREATE TABLE configuration.price_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    price_list_id UUID NOT NULL REFERENCES configuration.price_lists(id), product_id UUID NOT NULL REFERENCES products.products(id), unit_price NUMERIC(18,4) NOT NULL
);
COMMENT ON TABLE configuration.price_list_items IS 'Precio de un producto dentro de una lista.';
CREATE UNIQUE INDEX uq_configuration_price_list_items ON configuration.price_list_items (price_list_id, product_id) WHERE deleted_at IS NULL;

CREATE TABLE configuration.languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    iso_code TEXT NOT NULL
);
COMMENT ON TABLE configuration.languages IS 'Catálogo de idiomas habilitados (ISO 639-1).';
CREATE UNIQUE INDEX uq_configuration_languages_iso ON configuration.languages (iso_code) WHERE deleted_at IS NULL;

CREATE TABLE configuration.timezones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    iana_name TEXT NOT NULL
);
COMMENT ON TABLE configuration.timezones IS 'Catálogo de husos horarios (IANA).';

CREATE TABLE configuration.holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    country_id UUID NOT NULL REFERENCES configuration.countries(id), name TEXT NOT NULL, holiday_date DATE NOT NULL
);
COMMENT ON TABLE configuration.holidays IS 'Feriado/día no laborable, usado por hr/payroll/services.';

CREATE TABLE configuration.fiscal_regimes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    country_id UUID NOT NULL REFERENCES configuration.countries(id), name TEXT NOT NULL
);
COMMENT ON TABLE configuration.fiscal_regimes IS 'Régimen tributario disponible por país.';
ALTER TABLE taxes.tax_rules ADD CONSTRAINT fk_taxes_tax_rules_fiscal_regime FOREIGN KEY (fiscal_regime_id) REFERENCES configuration.fiscal_regimes(id);

CREATE TABLE configuration.fiscal_document_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    country_id UUID NOT NULL REFERENCES configuration.countries(id), code TEXT NOT NULL, name TEXT NOT NULL
);
COMMENT ON TABLE configuration.fiscal_document_types IS 'Catálogo de tipos de comprobante legal por país (CFDI, DTE, NFe, Factura A/B/C).';

ALTER TABLE sales.invoices ADD CONSTRAINT fk_sales_invoices_fiscal_doc_type FOREIGN KEY (fiscal_document_type_id) REFERENCES configuration.fiscal_document_types(id);

-- =============================================================================
-- FIN 21_configuration.sql — 23 tablas + cierre de 6 FKs diferidas.
--
-- FIN DEL BLOQUE DE ARCHIVOS DE DOMINIO (01-21): 498 tablas en 21 schemas
-- (494 originales + 3 agregadas en 01_core.sql SECCIÓN 13 — Business
-- Rules Engine y Background Jobs, docs/architecture/32-core-platform/ —
-- + 1 agregada en 17_projects.sql — project_role_rates,
-- docs/architecture/40-modulo-projects.md).
-- De acá en adelante, los archivos 22-30 son transversales: seed data,
-- índices consolidados, vistas, funciones, triggers, procedures, vistas
-- materializadas, particionamiento y respaldo — operan SOBRE las 498 tablas
-- ya creadas, no agregan nuevos schemas de negocio.
-- =============================================================================
