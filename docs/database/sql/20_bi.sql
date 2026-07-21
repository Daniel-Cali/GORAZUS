-- =============================================================================
-- GORAZUS ERP — 20_bi.sql
-- Módulo: BI
-- Schema: bi
-- Depende de: 01_core.sql, 19_reports.sql
-- Documentación funcional: docs/database/logico/20-bi.md
-- Consume agregados ya materializados (28_materialized_views.sql), no las
-- tablas transaccionales crudas.
-- Patrón universal de 18 columnas: ver 01_core.sql (encabezado).
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS bi;

CREATE TABLE bi.data_mart_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    materialized_view_name TEXT NOT NULL, refresh_frequency TEXT NOT NULL CHECK (refresh_frequency IN ('hourly', 'daily', 'weekly'))
);
COMMENT ON TABLE bi.data_mart_tables IS 'Registro de qué vista materializada alimenta qué análisis.';

CREATE TABLE bi.data_cubes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    name TEXT NOT NULL, data_mart_table_id UUID NOT NULL REFERENCES bi.data_mart_tables(id)
);
COMMENT ON TABLE bi.data_cubes IS 'Cubo analítico definido.';

CREATE TABLE bi.data_cube_dimensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    cube_id UUID NOT NULL REFERENCES bi.data_cubes(id), column_name TEXT NOT NULL, display_name TEXT NOT NULL
);
COMMENT ON TABLE bi.data_cube_dimensions IS 'Dimensión disponible en un cubo.';

CREATE TABLE bi.data_cube_measures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    cube_id UUID NOT NULL REFERENCES bi.data_cubes(id), column_name TEXT NOT NULL, aggregation TEXT NOT NULL CHECK (aggregation IN ('sum', 'avg', 'count', 'min', 'max'))
);
COMMENT ON TABLE bi.data_cube_measures IS 'Métrica agregable del cubo.';

CREATE TABLE bi.kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    name TEXT NOT NULL, formula TEXT NOT NULL, target_value NUMERIC(18,4)
);
COMMENT ON TABLE bi.kpis IS 'Indicador clave de negocio con fórmula y meta.';

CREATE TABLE bi.kpi_snapshots (
    id UUID NOT NULL DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    kpi_id UUID NOT NULL REFERENCES bi.kpis(id), snapshot_value NUMERIC(18,4) NOT NULL, snapshot_date DATE NOT NULL,
    -- PK/UNIQUE deben incluir la columna de partición (snapshot_date)
    PRIMARY KEY (id, snapshot_date), UNIQUE (local_id, snapshot_date)
) PARTITION BY RANGE (snapshot_date);
COMMENT ON TABLE bi.kpi_snapshots IS 'Valor calculado de un KPI en un momento dado, para tendencia histórica. Particionada mensualmente.';

CREATE TABLE bi.indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    name TEXT NOT NULL, formula TEXT NOT NULL
);
COMMENT ON TABLE bi.indicators IS 'Indicador de menor jerarquía que un KPI.';

CREATE TABLE bi.indicator_snapshots (
    id UUID NOT NULL DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    indicator_id UUID NOT NULL REFERENCES bi.indicators(id), snapshot_value NUMERIC(18,4) NOT NULL, snapshot_date DATE NOT NULL,
    -- PK/UNIQUE deben incluir la columna de partición (snapshot_date)
    PRIMARY KEY (id, snapshot_date), UNIQUE (local_id, snapshot_date)
) PARTITION BY RANGE (snapshot_date);
COMMENT ON TABLE bi.indicator_snapshots IS 'Valor histórico de un indicador. Particionada mensualmente.';

CREATE TABLE bi.metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    name TEXT NOT NULL, formula TEXT NOT NULL
);
COMMENT ON TABLE bi.metrics IS 'Métrica cruda agregable (sin meta asociada, a diferencia de KPI).';

CREATE TABLE bi.metric_snapshots (
    id UUID NOT NULL DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    metric_id UUID NOT NULL REFERENCES bi.metrics(id), snapshot_value NUMERIC(18,4) NOT NULL, snapshot_date DATE NOT NULL,
    -- PK/UNIQUE deben incluir la columna de partición (snapshot_date)
    PRIMARY KEY (id, snapshot_date), UNIQUE (local_id, snapshot_date)
) PARTITION BY RANGE (snapshot_date);
COMMENT ON TABLE bi.metric_snapshots IS 'Valor histórico de una métrica. Particionada mensualmente.';

CREATE TABLE bi.forecast_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    name TEXT NOT NULL, algorithm TEXT NOT NULL
);
COMMENT ON TABLE bi.forecast_models IS 'Modelo de pronóstico configurado.';

CREATE TABLE bi.forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    model_id UUID NOT NULL REFERENCES bi.forecast_models(id), forecast_date DATE NOT NULL, predicted_value NUMERIC(18,4) NOT NULL
);
COMMENT ON TABLE bi.forecasts IS 'Resultado de pronóstico generado por un modelo.';

CREATE TABLE bi.bi_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    kpi_id UUID REFERENCES bi.kpis(id), indicator_id UUID REFERENCES bi.indicators(id), metric_id UUID REFERENCES bi.metrics(id),
    threshold_operator TEXT NOT NULL CHECK (threshold_operator IN ('gt', 'lt', 'eq')), threshold_value NUMERIC(18,4) NOT NULL,
    CONSTRAINT ck_bi_alerts_single_source CHECK (num_nonnulls(kpi_id, indicator_id, metric_id) = 1)
);
COMMENT ON TABLE bi.bi_alerts IS 'Umbral definido sobre un KPI/indicador/métrica (exactamente uno de los tres).';

CREATE TABLE bi.bi_alert_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    alert_id UUID NOT NULL REFERENCES bi.bi_alerts(id), observed_value NUMERIC(18,4) NOT NULL
);
COMMENT ON TABLE bi.bi_alert_triggers IS 'Registro de cada activación de una alerta.';

-- =============================================================================
-- FIN 20_bi.sql — 14 tablas.
-- =============================================================================
