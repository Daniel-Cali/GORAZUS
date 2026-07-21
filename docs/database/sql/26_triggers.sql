-- =============================================================================
-- GORAZUS ERP — 26_triggers.sql
-- Funciones trigger + su asignación a las 494 tablas. Implementa
-- docs/database/05-estrategia-auditoria.md.
-- Depende de: 01_core.sql .. 25_functions.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Mantenimiento de columnas universales (updated_at, row_version)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION core.fn_set_audit_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := now();
    NEW.row_version := OLD.row_version + 1;
    RETURN NEW;
END;
$$;
COMMENT ON FUNCTION core.fn_set_audit_fields IS 'BEFORE UPDATE: mantiene updated_at y row_version (versión técnica, ver 01-modelo-conceptual.md §1.1) sin intervención de la aplicación.';

-- -----------------------------------------------------------------------------
-- 2. Auditoría genérica de cambios (core.audit_logs) — INMUTABLE
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION core.fn_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, pg_temp
AS $$
DECLARE
    v_old JSONB;
    v_new JSONB;
    v_row_id UUID;
    v_actor UUID;
BEGIN
    v_actor := NULLIF(current_setting('app.current_user_id', true), '')::UUID;

    IF TG_OP = 'DELETE' THEN
        v_old := to_jsonb(OLD);
        v_row_id := OLD.id;
    ELSIF TG_OP = 'UPDATE' THEN
        v_old := to_jsonb(OLD);
        v_new := to_jsonb(NEW);
        v_row_id := NEW.id;
    ELSE
        v_new := to_jsonb(NEW);
        v_row_id := NEW.id;
    END IF;

    INSERT INTO core.audit_logs (tenant_id, table_schema, table_name, row_id, operation, old_values, new_values, actor_user_id, occurred_at)
    VALUES (
        COALESCE(NEW.tenant_id, OLD.tenant_id), TG_TABLE_SCHEMA, TG_TABLE_NAME, v_row_id, TG_OP, v_old, v_new, v_actor, now()
    );

    RETURN COALESCE(NEW, OLD);
END;
$$;
COMMENT ON FUNCTION core.fn_audit_log IS 'AFTER INSERT/UPDATE/DELETE: captura genérica en core.audit_logs. SECURITY DEFINER — solo esta función tiene INSERT sobre audit_logs, ver 06-estrategia-seguridad.md §2 (rol gorazus_audit_writer).';

-- -----------------------------------------------------------------------------
-- 3. Snapshot completo selectivo (core.change_history)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION core.fn_change_history_snapshot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, pg_temp
AS $$
BEGIN
    INSERT INTO core.change_history (tenant_id, table_schema, table_name, row_id, snapshot, occurred_at)
    VALUES (NEW.tenant_id, TG_TABLE_SCHEMA, TG_TABLE_NAME, NEW.id, to_jsonb(NEW), now());
    RETURN NEW;
END;
$$;
COMMENT ON FUNCTION core.fn_change_history_snapshot IS 'AFTER INSERT/UPDATE: snapshot completo de la fila. Solo en tablas seleccionadas (ver §4 abajo), no universal.';

-- -----------------------------------------------------------------------------
-- 4. Asignación programática de fn_set_audit_fields y fn_audit_log a las 494
-- tablas, con lista de exclusión para tablas de puro log/auditoría técnica
-- (que ya SON el registro de auditoría — auditarlas a sí mismas es
-- redundante, ver 05-estrategia-auditoria.md §7).
-- -----------------------------------------------------------------------------

DO $$
DECLARE
    r RECORD;
    v_excluded TEXT[] := ARRAY[
        'core.audit_logs', 'core.system_logs', 'core.activity_logs', 'core.change_history',
        'security.security_audit_logs', 'security.session_activity_logs', 'security.login_attempts',
        'inventory.stock_movements', 'core.notification_delivery_logs',
        'crm.call_logs', 'crm.email_logs', 'crm.whatsapp_logs',
        'core.business_rule_evaluations', 'core.background_jobs'  -- ya SON el registro de su propia
                                                                    -- ejecución (docs/architecture/
                                                                    -- 32-core-platform/), mismo criterio
                                                                    -- que notification_delivery_logs
    ];
    v_full_name TEXT;
BEGIN
    FOR r IN
        SELECT table_schema, table_name
        FROM information_schema.tables
        WHERE table_schema IN ('core','security','customers','suppliers','products','inventory',
                                'sales','purchases','cash','banks','accounting','taxes','crm',
                                'hr','payroll','services','projects','assets','reports','bi','configuration')
          AND table_type = 'BASE TABLE'
    LOOP
        v_full_name := r.table_schema || '.' || r.table_name;
        IF v_full_name = ANY(v_excluded) THEN
            CONTINUE;
        END IF;

        EXECUTE format('CREATE TRIGGER trg_set_audit_fields BEFORE UPDATE ON %I.%I FOR EACH ROW EXECUTE FUNCTION core.fn_set_audit_fields()', r.table_schema, r.table_name);
        EXECUTE format('CREATE TRIGGER trg_audit_log AFTER INSERT OR UPDATE OR DELETE ON %I.%I FOR EACH ROW EXECUTE FUNCTION core.fn_audit_log()', r.table_schema, r.table_name);
    END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 5. change_history selectivo — solo en entidades de valor legal/contractual
-- alto (ver 05-estrategia-auditoria.md §3).
-- -----------------------------------------------------------------------------

CREATE TRIGGER trg_change_history AFTER INSERT OR UPDATE ON sales.invoices FOR EACH ROW EXECUTE FUNCTION core.fn_change_history_snapshot();
CREATE TRIGGER trg_change_history AFTER INSERT OR UPDATE ON purchases.purchase_invoices FOR EACH ROW EXECUTE FUNCTION core.fn_change_history_snapshot();
CREATE TRIGGER trg_change_history AFTER INSERT OR UPDATE ON accounting.journal_entries FOR EACH ROW EXECUTE FUNCTION core.fn_change_history_snapshot();
CREATE TRIGGER trg_change_history AFTER INSERT OR UPDATE ON sales.sales_contracts FOR EACH ROW EXECUTE FUNCTION core.fn_change_history_snapshot();
CREATE TRIGGER trg_change_history AFTER INSERT OR UPDATE ON services.service_contracts FOR EACH ROW EXECUTE FUNCTION core.fn_change_history_snapshot();
CREATE TRIGGER trg_change_history AFTER INSERT OR UPDATE ON projects.projects FOR EACH ROW EXECUTE FUNCTION core.fn_change_history_snapshot();
CREATE TRIGGER trg_change_history AFTER INSERT OR UPDATE ON accounting.chart_of_accounts FOR EACH ROW EXECUTE FUNCTION core.fn_change_history_snapshot();
CREATE TRIGGER trg_change_history AFTER INSERT OR UPDATE ON taxes.tax_rates FOR EACH ROW EXECUTE FUNCTION core.fn_change_history_snapshot();

-- -----------------------------------------------------------------------------
-- 6. Mantenimiento de saldo agregado inventory.stock a partir de
-- inventory.stock_movements (evita recalcular SUM() sobre millones de
-- movimientos en cada consulta de disponibilidad).
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION inventory.fn_apply_stock_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_direction TEXT;
    v_delta NUMERIC;
BEGIN
    SELECT direction INTO v_direction FROM inventory.stock_movement_types WHERE id = NEW.movement_type_id;
    v_delta := CASE WHEN v_direction = 'in' THEN NEW.quantity ELSE -NEW.quantity END;

    INSERT INTO inventory.stock (tenant_id, company_id, branch_id, product_id, warehouse_id, quantity_on_hand, created_by)
    VALUES (NEW.tenant_id, NEW.company_id, NEW.branch_id, NEW.product_id, NEW.warehouse_id, v_delta, NEW.created_by)
    ON CONFLICT (product_id, warehouse_id, COALESCE(location_id, '00000000-0000-0000-0000-000000000000'))
    WHERE deleted_at IS NULL
    DO UPDATE SET quantity_on_hand = inventory.stock.quantity_on_hand + v_delta, updated_at = now();

    RETURN NEW;
END;
$$;
COMMENT ON FUNCTION inventory.fn_apply_stock_movement IS 'Mantiene inventory.stock como agregado incremental de stock_movements — evita recalcular SUM() sobre la tabla particionada completa en cada consulta.';

CREATE TRIGGER trg_apply_stock_movement AFTER INSERT ON inventory.stock_movements FOR EACH ROW EXECUTE FUNCTION inventory.fn_apply_stock_movement();

-- -----------------------------------------------------------------------------
-- 7. Validación de partida doble antes de mayorizar un asiento
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION accounting.fn_prevent_unbalanced_posting()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_status_code TEXT;
BEGIN
    SELECT code INTO v_status_code FROM accounting.journal_entry_status WHERE id = NEW.status_id;

    IF v_status_code = 'posted' AND NOT accounting.fn_is_journal_entry_balanced(NEW.id) THEN
        RAISE EXCEPTION 'No se puede mayorizar el asiento %: los débitos no igualan a los créditos', NEW.document_number;
    END IF;

    RETURN NEW;
END;
$$;
COMMENT ON FUNCTION accounting.fn_prevent_unbalanced_posting IS 'Bloquea la transición a estado posted si el asiento no cuadra — la partida doble se hace cumplir en la base, no solo en la aplicación.';

CREATE TRIGGER trg_prevent_unbalanced_posting BEFORE UPDATE ON accounting.journal_entries FOR EACH ROW
    WHEN (NEW.status_id IS DISTINCT FROM OLD.status_id)
    EXECUTE FUNCTION accounting.fn_prevent_unbalanced_posting();

-- =============================================================================
-- FIN 26_triggers.sql
-- Permisos: gorazus_app NO tiene INSERT/UPDATE/DELETE directo sobre
-- core.audit_logs / core.change_history — solo estas funciones
-- SECURITY DEFINER pueden escribir ahí (ver 06-estrategia-seguridad.md §2).
-- =============================================================================
