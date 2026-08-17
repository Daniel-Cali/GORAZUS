-- ============================================================================
-- 36_crm_customer_completion.sql
-- CRM — Parte 02: cierre de brechas reales en customers/crm para soportar
-- Notas, Calificaciones, Timeline y Recordatorios directos sobre un cliente
-- ya convertido. Migración aditiva, append-only — no modifica ni elimina
-- nada de lo ya certificado (Database Enterprise v1.1.0).
--
-- Auditoría previa (docs/database/dictionary/03-customers.md,
-- docs/database/dictionary/13-crm.md) confirmó que la gran mayoría de lo
-- pedido (Clientes, Contactos, Direcciones múltiples, Categorías, Límites de
-- crédito, Condiciones de pago, Listas de precios, Documentos, Estado,
-- Historial) YA EXISTE — 17 tablas reales en `customers` + mecanismos
-- genéricos ya construidos (`core.entity_tags`/`core.tags` para Tags,
-- `core.documents`/`core.files` para Documentos/Adjuntos,
-- `sales.salespeople` para Vendedores). Esta migración NO las duplica.
-- Gaps reales encontrados y cerrados acá:
--   1. crm.follow_up_activities no podía referenciar un cliente directamente
--      (solo lead_id/opportunity_id) — Recordatorios de un cliente ya
--      convertido no tenían dónde vivir.
--   2. Sin mecanismo de Notas libres fechadas/autoría por cliente
--      (`observations` es un único campo, no una lista).
--   3. Sin mecanismo de Calificación de cliente (sí existe el análogo para
--      proveedores, `suppliers.supplier_evaluation_scores`, pero nada para
--      clientes).
--   4. Sin vista consolidada de Timeline — se construye sobre datos que ya
--      existen, no se duplica nada.
-- Grupos de clientes: NO se agrega tabla nueva — ya cubierto por
-- `customer_categories` + `customer_classifications` (dos dimensiones ya
-- existentes); una tercera taxonomía sería redundancia, no un gap real.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. crm.follow_up_activities — permitir referenciar un cliente directamente
-- ----------------------------------------------------------------------------

ALTER TABLE crm.follow_up_activities
    ADD COLUMN customer_id UUID;

COMMENT ON COLUMN crm.follow_up_activities.customer_id IS
    'Cliente ya convertido (customers.customers) al que aplica el seguimiento, cuando ya no hay lead/oportunidad activos en curso. ID suelto (sin FK física) — mismo patrón cross-schema ya usado en call_logs/email_logs/whatsapp_logs de este mismo schema.';

CREATE INDEX idx_crm_follow_up_activities_customer
    ON crm.follow_up_activities (customer_id)
    WHERE customer_id IS NOT NULL AND deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 2. customers.customer_notes — notas libres, fechadas, con autoría
-- ----------------------------------------------------------------------------

CREATE TABLE customers.customer_notes (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id       BIGINT NOT NULL,
    tenant_id      UUID NOT NULL,
    company_id     UUID NOT NULL,
    branch_id      UUID,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at     TIMESTAMPTZ,
    created_by     UUID,
    updated_by     UUID,
    deleted_by     UUID,
    version        INTEGER NOT NULL DEFAULT 1,
    row_version    BIGINT NOT NULL DEFAULT 0,
    is_active      BOOLEAN NOT NULL DEFAULT true,
    is_deleted     BOOLEAN,
    observations   TEXT,
    metadata       JSONB NOT NULL DEFAULT '{}'::jsonb,
    customer_id    UUID NOT NULL REFERENCES customers.customers(id),
    author_user_id UUID NOT NULL,
    note_text      TEXT NOT NULL,
    is_pinned      BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE customers.customer_notes IS
    'Notas libres sobre un cliente, fechadas y con autoría — distinto de `observations` (campo único no versionado presente en toda tabla). Cierra el gap "Customer notes" del pedido de completado de CRM.';
COMMENT ON COLUMN customers.customer_notes.is_pinned IS
    'Nota fijada al tope del historial (p. ej. "cliente sensible a atrasos") — de aplicación, no de negocio con reglas propias.';

CREATE INDEX idx_customers_customer_notes_customer
    ON customers.customer_notes (customer_id, created_at DESC)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_customer_notes_pinned
    ON customers.customer_notes (customer_id)
    WHERE is_pinned = true AND deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 3. customers.customer_ratings — calificación interna del cliente
-- ----------------------------------------------------------------------------

CREATE TABLE customers.customer_ratings (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id          BIGINT NOT NULL,
    tenant_id         UUID NOT NULL,
    company_id        UUID NOT NULL,
    branch_id         UUID,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at        TIMESTAMPTZ,
    created_by        UUID,
    updated_by        UUID,
    deleted_by        UUID,
    version           INTEGER NOT NULL DEFAULT 1,
    row_version       BIGINT NOT NULL DEFAULT 0,
    is_active         BOOLEAN NOT NULL DEFAULT true,
    is_deleted        BOOLEAN,
    observations      TEXT,
    metadata          JSONB NOT NULL DEFAULT '{}'::jsonb,
    customer_id       UUID NOT NULL REFERENCES customers.customers(id),
    rated_by_user_id  UUID NOT NULL,
    rating_type       TEXT NOT NULL DEFAULT 'general'
        CHECK (rating_type IN ('general', 'payment_behavior', 'service_experience')),
    score             NUMERIC(3,1) NOT NULL CHECK (score >= 0 AND score <= 10),
    rated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE customers.customer_ratings IS
    'Calificación interna de un cliente (no de un producto — ver products.product_reviews, que es lo inverso). Análogo simplificado de suppliers.supplier_evaluation_scores, sin el andamiaje de criterios/evaluaciones porque el pedido no lo requiere — evitar complejidad no solicitada.';
COMMENT ON COLUMN customers.customer_ratings.rating_type IS
    'general = impresión global; payment_behavior = puntualidad de pago (insumo real para crédito); service_experience = trato/soporte.';

CREATE INDEX idx_customers_customer_ratings_customer
    ON customers.customer_ratings (customer_id, rated_at DESC)
    WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 4. customers.v_customer_timeline — vista consolidada, sin duplicar datos
-- ----------------------------------------------------------------------------

CREATE VIEW customers.v_customer_timeline AS
SELECT customer_id, 'note'::text AS event_type, created_at AS event_at,
       note_text AS summary, author_user_id AS actor_user_id
FROM customers.customer_notes
WHERE deleted_at IS NULL
UNION ALL
SELECT customer_id, 'rating'::text, rated_at,
       'Calificación ' || rating_type || ': ' || score::text,
       rated_by_user_id
FROM customers.customer_ratings
WHERE deleted_at IS NULL
UNION ALL
SELECT customer_id, 'visit'::text, visited_at,
       coalesce(outcome_notes, 'Visita registrada'), visited_by_user_id
FROM customers.customer_visits
WHERE deleted_at IS NULL
UNION ALL
SELECT customer_id, 'block_history'::text, created_at,
       action || coalesce(': ' || reason, ''), created_by
FROM customers.customer_block_history
WHERE deleted_at IS NULL
UNION ALL
SELECT customer_id, 'credit_limit_change'::text, created_at,
       'Límite de crédito: ' || previous_limit::text || ' -> ' || new_limit::text,
       approved_by_user_id
FROM customers.customer_credit_limit_history
WHERE deleted_at IS NULL
UNION ALL
SELECT customer_id, 'call'::text, created_at,
       coalesce(outcome, 'Llamada registrada'), created_by
FROM crm.call_logs
WHERE customer_id IS NOT NULL AND deleted_at IS NULL
UNION ALL
SELECT customer_id, 'email'::text, created_at,
       coalesce(subject, 'Email registrado'), created_by
FROM crm.email_logs
WHERE customer_id IS NOT NULL AND deleted_at IS NULL
UNION ALL
SELECT customer_id, 'whatsapp'::text, created_at,
       coalesce(left(message_body, 140), 'Mensaje de WhatsApp'), created_by
FROM crm.whatsapp_logs
WHERE customer_id IS NOT NULL AND deleted_at IS NULL
UNION ALL
SELECT customer_id, 'follow_up'::text, coalesce(completed_at, due_at),
       CASE WHEN completed_at IS NOT NULL THEN 'Seguimiento completado' ELSE 'Seguimiento pendiente' END,
       assigned_to_user_id
FROM crm.follow_up_activities
WHERE customer_id IS NOT NULL AND deleted_at IS NULL;

COMMENT ON VIEW customers.v_customer_timeline IS
    'Timeline consolidado de un cliente — UNION de solo lectura sobre datos ya existentes (notas, calificaciones, visitas, historial de bloqueo/crédito, bitácora de interacción CRM, seguimientos). No almacena nada nuevo, cierra el gap "Customer timeline" sin duplicar datos. Mismo patrón de vista ya usado en el proyecto (v_kardex, v_accounts_receivable_aging).';

-- ----------------------------------------------------------------------------
-- 5. RLS + triggers de auditoría en las 2 tablas nuevas (no heredado, se
--    aplica explícitamente como en toda tabla nueva del proyecto)
-- ----------------------------------------------------------------------------

DO $$
DECLARE
    v_schema TEXT;
    v_table TEXT;
BEGIN
    FOR v_schema, v_table IN VALUES ('customers', 'customer_notes'), ('customers', 'customer_ratings')
    LOOP
        EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', v_schema, v_table);
        EXECUTE format('ALTER TABLE %I.%I FORCE ROW LEVEL SECURITY', v_schema, v_table);
        EXECUTE format(
            'CREATE POLICY tenant_isolation ON %I.%I USING (tenant_id = current_setting(''app.current_tenant_id'', true)::uuid OR tenant_id = ''00000000-0000-0000-0000-000000000000'')',
            v_schema, v_table
        );
        EXECUTE format('CREATE TRIGGER trg_set_audit_fields BEFORE UPDATE ON %I.%I FOR EACH ROW EXECUTE FUNCTION core.fn_set_audit_fields()', v_schema, v_table);
        EXECUTE format('CREATE TRIGGER trg_audit_log AFTER INSERT OR DELETE OR UPDATE ON %I.%I FOR EACH ROW EXECUTE FUNCTION core.fn_audit_log()', v_schema, v_table);
    END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 6. Permisos — las tablas/vista nuevas no heredan el GRANT masivo por
--    schema que se ejecutó una única vez en 30_backup_restore.sql (no hay
--    ALTER DEFAULT PRIVILEGES configurado para ningún schema del proyecto).
--    Mismo patrón exacto de roles, aplicado explícitamente a los 3 objetos
--    nuevos.
--    Hotfix relacionado (mismo root cause, descubierto al regenerar Prisma
--    en esta misma sesión): suppliers.supplier_contracts Y
--    products.product_physical_attributes (ambas de la migración 35)
--    tenían el mismo problema — sin GRANT, Prisma no podía introspectarlas
--    y el modelo desaparecía de schema.prisma en cada `db:pull` nuevo (una
--    funcionalidad ya commiteada, regresión real si no se corrige). Se
--    corrige acá porque es el mismo fix de una línea, no una migración de
--    schema — no se toca nada más de la migración 35. `core.restore_test_logs`
--    tiene el mismo síntoma pero NO se toca — ya documentado como
--    exclusión intencional (tabla de simulacros de restauración, de uso
--    operativo/DR, no de aplicación).
-- ----------------------------------------------------------------------------

GRANT SELECT, INSERT, UPDATE, DELETE ON customers.customer_notes, customers.customer_ratings TO gorazus_app;
GRANT SELECT ON customers.customer_notes, customers.customer_ratings, customers.v_customer_timeline TO gorazus_readonly;
GRANT ALL ON customers.customer_notes, customers.customer_ratings TO gorazus_migrator;
GRANT SELECT ON customers.v_customer_timeline TO gorazus_app, gorazus_migrator;

GRANT SELECT, INSERT, UPDATE, DELETE ON suppliers.supplier_contracts TO gorazus_app;
GRANT SELECT ON suppliers.supplier_contracts TO gorazus_readonly;
GRANT ALL ON suppliers.supplier_contracts TO gorazus_migrator;

GRANT SELECT, INSERT, UPDATE, DELETE ON products.product_physical_attributes TO gorazus_app;
GRANT SELECT ON products.product_physical_attributes TO gorazus_readonly;
GRANT ALL ON products.product_physical_attributes TO gorazus_migrator;

-- ----------------------------------------------------------------------------
-- 7. Verificación
-- ----------------------------------------------------------------------------

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT count(*) INTO v_count FROM information_schema.tables
        WHERE table_schema = 'customers' AND table_name IN ('customer_notes', 'customer_ratings');
    IF v_count <> 2 THEN
        RAISE EXCEPTION 'Verificacion fallo: se esperaban 2 tablas nuevas en customers, se encontraron %', v_count;
    END IF;

    SELECT count(*) INTO v_count FROM pg_views
        WHERE schemaname = 'customers' AND viewname = 'v_customer_timeline';
    IF v_count <> 1 THEN
        RAISE EXCEPTION 'Verificacion fallo: v_customer_timeline no existe';
    END IF;

    SELECT count(*) INTO v_count FROM information_schema.columns
        WHERE table_schema = 'crm' AND table_name = 'follow_up_activities' AND column_name = 'customer_id';
    IF v_count <> 1 THEN
        RAISE EXCEPTION 'Verificacion fallo: crm.follow_up_activities.customer_id no existe';
    END IF;

    SELECT count(*) INTO v_count FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'customers' AND c.relname IN ('customer_notes', 'customer_ratings')
          AND c.relforcerowsecurity = true;
    IF v_count <> 2 THEN
        RAISE EXCEPTION 'Verificacion fallo: RLS no forzado en las 2 tablas nuevas (encontrado %)', v_count;
    END IF;

    SELECT count(*) INTO v_count FROM information_schema.role_table_grants
        WHERE table_schema = 'customers' AND table_name = 'customer_notes' AND grantee = 'gorazus_app';
    IF v_count = 0 THEN
        RAISE EXCEPTION 'Verificacion fallo: gorazus_app sin GRANT en customer_notes';
    END IF;

    RAISE NOTICE '36_crm_customer_completion: OK';
END $$;
