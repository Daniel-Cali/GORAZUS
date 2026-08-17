-- ============================================================================
-- 38_crm_opportunities_seed.sql
-- CRM — Parte 03 (código real de Oportunidades). Sembrado de los catálogos
-- crm.sales_funnels/sales_funnel_stages/opportunity_loss_reasons — vacíos
-- hasta ahora, requeridos por OportunidadesService.crear()/perder().
-- Descubierto en el camino: a diferencia de crm.lead_status (sin FK de
-- company_id), sales_funnels.company_id SÍ tiene FK real hacia
-- core.companies — no admite un id sentinela inventado. Se siembra un
-- embudo "Estándar" por cada empresa real ya existente (DO loop), no un
-- valor hardcodeado.
-- ============================================================================

DO $$
DECLARE
    v_company RECORD;
    v_funnel_id UUID;
    v_tenant_id UUID;
BEGIN
    FOR v_company IN SELECT id, tenant_id FROM core.companies WHERE deleted_at IS NULL LOOP
        v_tenant_id := v_company.tenant_id;

        IF NOT EXISTS (
            SELECT 1 FROM crm.sales_funnels
            WHERE company_id = v_company.id AND name = 'Estándar' AND deleted_at IS NULL
        ) THEN
            INSERT INTO crm.sales_funnels (tenant_id, company_id, name, created_by)
            VALUES (v_tenant_id, v_company.id, 'Estándar', '00000000-0000-0000-0000-000000000001')
            RETURNING id INTO v_funnel_id;

            INSERT INTO crm.sales_funnel_stages
                (tenant_id, company_id, funnel_id, name, stage_order, win_probability_percentage, created_by)
            VALUES
                (v_tenant_id, v_company.id, v_funnel_id, 'Calificación', 1, 10.00, '00000000-0000-0000-0000-000000000001'),
                (v_tenant_id, v_company.id, v_funnel_id, 'Propuesta', 2, 40.00, '00000000-0000-0000-0000-000000000001'),
                (v_tenant_id, v_company.id, v_funnel_id, 'Negociación', 3, 70.00, '00000000-0000-0000-0000-000000000001'),
                (v_tenant_id, v_company.id, v_funnel_id, 'Cierre', 4, 90.00, '00000000-0000-0000-0000-000000000001');
        END IF;
    END LOOP;
END $$;

-- Catálogo de motivos de pérdida — sin FK de company_id (nullable), tenant sentinela, mismo
-- patrón que crm.lead_status.
INSERT INTO crm.opportunity_loss_reasons (tenant_id, name, created_by) VALUES
    ('00000000-0000-0000-0000-000000000000', 'Precio', '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000', 'Competencia', '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000', 'Sin presupuesto', '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000', 'Sin respuesta', '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000', 'Otro', '00000000-0000-0000-0000-000000000001');

DO $$
DECLARE
    v_count INTEGER;
    v_companies INTEGER;
BEGIN
    SELECT count(*) INTO v_companies FROM core.companies WHERE deleted_at IS NULL;

    SELECT count(*) INTO v_count FROM crm.sales_funnels WHERE name = 'Estándar';
    IF v_count <> v_companies THEN
        RAISE EXCEPTION 'Verificacion fallo: se esperaba 1 embudo Estandar por empresa (%), se encontraron %', v_companies, v_count;
    END IF;

    SELECT count(*) INTO v_count FROM crm.sales_funnel_stages;
    IF v_count <> v_companies * 4 THEN
        RAISE EXCEPTION 'Verificacion fallo: se esperaban % etapas (4 x empresa), se encontraron %', v_companies * 4, v_count;
    END IF;

    SELECT count(*) INTO v_count FROM crm.opportunity_loss_reasons
        WHERE tenant_id = '00000000-0000-0000-0000-000000000000';
    IF v_count <> 5 THEN
        RAISE EXCEPTION 'Verificacion fallo: se esperaban 5 motivos de perdida, se encontraron %', v_count;
    END IF;

    RAISE NOTICE '38_crm_opportunities_seed: OK (% empresas)', v_companies;
END $$;
