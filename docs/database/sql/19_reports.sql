-- =============================================================================
-- GORAZUS ERP — 19_reports.sql
-- Módulo: Reports
-- Schema: reports
-- Depende de: 01_core.sql
-- Documentación funcional: docs/database/logico/19-reports.md
-- Consumidor de solo lectura de proyecciones de todos los módulos — nunca
-- dueño de datos transaccionales.
-- Patrón universal de 18 columnas: ver 01_core.sql (encabezado).
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS reports;

CREATE TABLE reports.report_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    name TEXT NOT NULL, source_module TEXT NOT NULL, base_query_name TEXT NOT NULL,
    is_ad_hoc BOOLEAN NOT NULL DEFAULT false, ad_hoc_config JSONB
);
COMMENT ON TABLE reports.report_definitions IS 'Reporte disponible en el catálogo (origen: módulo, query base). is_ad_hoc/ad_hoc_config agregados por docs/architecture/41-modulo-bi.md §2 — cierra el gap real del "Generador de Reportes Personalizados" (docs/menus/20-reportes.md), que citaba tablas reportes.reporte_personalizado/reporte_personalizado_campo inexistentes. Cuando is_ad_hoc=true, base_query_name sigue siendo la query base sobre la que ad_hoc_config (campos/filtros/agrupaciones elegidos por el usuario) se aplica, en vez de definir un reporte fijo.';

CREATE TABLE reports.report_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    report_definition_id UUID NOT NULL REFERENCES reports.report_definitions(id), layout_html TEXT NOT NULL
);
COMMENT ON TABLE reports.report_templates IS 'Plantilla de layout de un reporte.';

CREATE TABLE reports.report_template_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    template_id UUID NOT NULL REFERENCES reports.report_templates(id), language_code TEXT NOT NULL, layout_html TEXT NOT NULL
);
COMMENT ON TABLE reports.report_template_translations IS 'Traducción de la plantilla por idioma.';
CREATE UNIQUE INDEX uq_reports_template_translations ON reports.report_template_translations (template_id, language_code) WHERE deleted_at IS NULL;

CREATE TABLE reports.report_parameters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    report_definition_id UUID NOT NULL REFERENCES reports.report_definitions(id), parameter_key TEXT NOT NULL, data_type TEXT NOT NULL
);
COMMENT ON TABLE reports.report_parameters IS 'Parámetro configurable del reporte.';

CREATE TABLE reports.report_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    report_definition_id UUID NOT NULL REFERENCES reports.report_definitions(id), executed_by_user_id UUID NOT NULL REFERENCES core.users(id), parameters_used JSONB NOT NULL DEFAULT '{}'::jsonb
);
COMMENT ON TABLE reports.report_executions IS 'Ejecución concreta de un reporte.';

CREATE TABLE reports.report_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    execution_id UUID NOT NULL REFERENCES reports.report_executions(id), file_id UUID NOT NULL REFERENCES core.files(id), export_format TEXT NOT NULL CHECK (export_format IN ('pdf', 'xlsx', 'csv', 'image'))
);
COMMENT ON TABLE reports.report_exports IS 'Archivo generado de una ejecución. Valor ''image'' agregado por docs/architecture/41-modulo-bi.md §2 — cierra "Exportar Tablero a Imagen" (docs/menus/21-bi.md), sin formato de exportación hasta ahora.';

CREATE TABLE reports.report_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    report_definition_id UUID NOT NULL REFERENCES reports.report_definitions(id), cron_expression TEXT NOT NULL
);
COMMENT ON TABLE reports.report_schedules IS 'Programación de ejecución periódica.';

CREATE TABLE reports.report_schedule_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    schedule_id UUID NOT NULL REFERENCES reports.report_schedules(id), user_id UUID NOT NULL REFERENCES core.users(id)
);
COMMENT ON TABLE reports.report_schedule_recipients IS 'Destinatarios de la programación.';

CREATE TABLE reports.report_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    report_definition_id UUID NOT NULL REFERENCES reports.report_definitions(id), user_id UUID NOT NULL REFERENCES core.users(id)
);
COMMENT ON TABLE reports.report_favorites IS 'Reportes marcados como favoritos por un usuario.';
CREATE UNIQUE INDEX uq_reports_favorites ON reports.report_favorites (report_definition_id, user_id) WHERE deleted_at IS NULL;

CREATE TABLE reports.dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    owner_user_id UUID NOT NULL REFERENCES core.users(id), name TEXT NOT NULL
);
COMMENT ON TABLE reports.dashboards IS 'Panel armado por el usuario (distinto del Dashboard de inicio del sistema).';

CREATE TABLE reports.dashboard_widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    dashboard_id UUID NOT NULL REFERENCES reports.dashboards(id), report_definition_id UUID NOT NULL REFERENCES reports.report_definitions(id), position_order SMALLINT NOT NULL DEFAULT 0,
    chart_type TEXT NOT NULL DEFAULT 'table' CHECK (chart_type IN ('table', 'line', 'bar', 'pie', 'area', 'number'))
);
COMMENT ON TABLE reports.dashboard_widgets IS 'Widget dentro de un dashboard, con su fuente de datos. chart_type agregado por docs/architecture/41-modulo-bi.md §1 — sin esta columna no había forma de saber cómo renderizar un widget más allá de tabla.';

-- =============================================================================
-- FIN 19_reports.sql — 11 tablas.
-- =============================================================================
