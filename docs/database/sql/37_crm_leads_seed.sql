-- ============================================================================
-- 37_crm_leads_seed.sql
-- CRM — Parte 02 (código real de Leads). Sembrado del catálogo
-- crm.lead_status — vacío hasta ahora, requerido por LeadsService.crear()
-- ("nuevo") y LeadsService.convertir() ("convertido"). Mismo patrón que
-- sales.invoice_status/purchases.purchase_order_status en
-- docs/database/sql/22_seed_data.sql (tenant sentinela, sin datos reales).
-- ============================================================================

INSERT INTO crm.lead_status (tenant_id, code, created_by) VALUES
    ('00000000-0000-0000-0000-000000000000', 'nuevo', '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000', 'contactado', '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000', 'calificado', '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000', 'convertido', '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000', 'descartado', '00000000-0000-0000-0000-000000000001');

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT count(*) INTO v_count FROM crm.lead_status
        WHERE tenant_id = '00000000-0000-0000-0000-000000000000'
          AND code IN ('nuevo', 'contactado', 'calificado', 'convertido', 'descartado');
    IF v_count <> 5 THEN
        RAISE EXCEPTION 'Verificacion fallo: se esperaban 5 codigos de lead_status, se encontraron %', v_count;
    END IF;
    RAISE NOTICE '37_crm_leads_seed: OK';
END $$;
