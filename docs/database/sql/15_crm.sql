-- =============================================================================
-- GORAZUS ERP — 15_crm.sql
-- Módulo: CRM
-- Schema: crm
-- Depende de: 01_core.sql, 03_customers.sql, 05_products.sql, 07_sales.sql
-- Documentación funcional: docs/database/logico/13-crm.md
-- Lead/Prospecto/Cliente potencial consolidados en una sola tabla `leads`.
-- Agenda/Calendario consolidados en `calendar_events`.
-- Patrón universal de 18 columnas: ver 01_core.sql (encabezado).
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS crm;

CREATE TABLE crm.lead_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    name TEXT NOT NULL  -- referido, web, feria, campaña
);
COMMENT ON TABLE crm.lead_sources IS 'Origen del lead.';

CREATE TABLE crm.lead_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    code TEXT NOT NULL  -- nuevo, contactado, calificado
);
COMMENT ON TABLE crm.lead_status IS 'Catálogo de estados de calificación.';

CREATE TABLE crm.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    full_name TEXT NOT NULL, email TEXT, phone TEXT, source_id UUID REFERENCES crm.lead_sources(id), status_id UUID NOT NULL REFERENCES crm.lead_status(id),
    assigned_salesperson_id UUID REFERENCES sales.salespeople(id), converted_customer_id UUID REFERENCES customers.customers(id)
);
COMMENT ON TABLE crm.leads IS 'Contacto comercial en cualquier etapa previa a ser cliente formal (consolida Lead/Prospecto/Cliente Potencial).';

CREATE TABLE crm.lead_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    lead_id UUID NOT NULL REFERENCES crm.leads(id), status_id UUID NOT NULL REFERENCES crm.lead_status(id)
);
COMMENT ON TABLE crm.lead_status_history IS 'Historial de transición.';

CREATE TABLE crm.sales_funnels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    name TEXT NOT NULL
);
COMMENT ON TABLE crm.sales_funnels IS 'Embudo de ventas (puede haber más de uno).';

CREATE TABLE crm.sales_funnel_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    funnel_id UUID NOT NULL REFERENCES crm.sales_funnels(id), name TEXT NOT NULL, stage_order SMALLINT NOT NULL, win_probability_percentage NUMERIC(5,2) NOT NULL DEFAULT 0
);
COMMENT ON TABLE crm.sales_funnel_stages IS 'Etapa dentro de un embudo, con probabilidad de cierre esperada.';

CREATE TABLE crm.opportunity_loss_reasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    name TEXT NOT NULL
);
COMMENT ON TABLE crm.opportunity_loss_reasons IS 'Catálogo de motivos de pérdida.';

CREATE TABLE crm.opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    lead_id UUID REFERENCES crm.leads(id), customer_id UUID REFERENCES customers.customers(id), funnel_stage_id UUID NOT NULL REFERENCES crm.sales_funnel_stages(id),
    estimated_amount NUMERIC(18,4) NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost')),
    loss_reason_id UUID REFERENCES crm.opportunity_loss_reasons(id), resulting_sales_order_id UUID REFERENCES sales.sales_orders(id)
);
COMMENT ON TABLE crm.opportunities IS 'Oportunidad de venta.';

CREATE TABLE crm.opportunity_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    opportunity_id UUID NOT NULL REFERENCES crm.opportunities(id), product_id UUID NOT NULL REFERENCES products.products(id), estimated_quantity NUMERIC(18,6) NOT NULL
);
COMMENT ON TABLE crm.opportunity_lines IS 'Producto/servicio incluido en la oportunidad.';

CREATE TABLE crm.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    name TEXT NOT NULL, budget_amount NUMERIC(18,4), starts_on DATE, ends_on DATE
);
COMMENT ON TABLE crm.campaigns IS 'Campaña de marketing con presupuesto.';

CREATE TABLE crm.campaign_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    campaign_id UUID NOT NULL REFERENCES crm.campaigns(id), lead_id UUID NOT NULL REFERENCES crm.leads(id)
);
COMMENT ON TABLE crm.campaign_members IS 'Leads asociados a una campaña (N:M).';
CREATE UNIQUE INDEX uq_crm_campaign_members ON crm.campaign_members (campaign_id, lead_id) WHERE deleted_at IS NULL;

CREATE TABLE crm.follow_up_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    lead_id UUID REFERENCES crm.leads(id), opportunity_id UUID REFERENCES crm.opportunities(id), assigned_to_user_id UUID NOT NULL REFERENCES core.users(id),
    due_at TIMESTAMPTZ NOT NULL, completed_at TIMESTAMPTZ
);
COMMENT ON TABLE crm.follow_up_activities IS 'Tarea/pendiente de seguimiento.';

CREATE TABLE crm.call_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    lead_id UUID REFERENCES crm.leads(id), customer_id UUID REFERENCES customers.customers(id), duration_seconds INTEGER, outcome TEXT,
    -- PK/UNIQUE deben incluir la columna de partición (created_at)
    PRIMARY KEY (id, created_at), UNIQUE (local_id, created_at)
) PARTITION BY RANGE (created_at);
COMMENT ON TABLE crm.call_logs IS 'Registro de llamada. Particionada mensualmente.';

CREATE TABLE crm.email_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    lead_id UUID REFERENCES crm.leads(id), customer_id UUID REFERENCES customers.customers(id), subject TEXT, direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    -- PK/UNIQUE deben incluir la columna de partición (created_at)
    PRIMARY KEY (id, created_at), UNIQUE (local_id, created_at)
) PARTITION BY RANGE (created_at);
COMMENT ON TABLE crm.email_logs IS 'Registro de correo enviado/recibido. Particionada mensualmente.';

CREATE TABLE crm.whatsapp_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    lead_id UUID REFERENCES crm.leads(id), customer_id UUID REFERENCES customers.customers(id), message_body TEXT, direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    -- PK/UNIQUE deben incluir la columna de partición (created_at)
    PRIMARY KEY (id, created_at), UNIQUE (local_id, created_at)
) PARTITION BY RANGE (created_at);
COMMENT ON TABLE crm.whatsapp_logs IS 'Registro de mensaje de WhatsApp. Particionada mensualmente.';

CREATE TABLE crm.calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    owner_user_id UUID NOT NULL REFERENCES core.users(id), title TEXT NOT NULL, starts_at TIMESTAMPTZ NOT NULL, ends_at TIMESTAMPTZ NOT NULL,
    lead_id UUID REFERENCES crm.leads(id), opportunity_id UUID REFERENCES crm.opportunities(id)
);
COMMENT ON TABLE crm.calendar_events IS 'Evento de agenda/calendario (consolida Agenda y Calendario).';

CREATE TABLE crm.calendar_event_attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    event_id UUID NOT NULL REFERENCES crm.calendar_events(id), user_id UUID REFERENCES core.users(id), external_email TEXT
);
COMMENT ON TABLE crm.calendar_event_attendees IS 'Asistentes al evento (internos y externos).';

-- =============================================================================
-- FIN 15_crm.sql — 17 tablas.
-- =============================================================================
