-- =============================================================================
-- GORAZUS ERP — 27_procedures.sql
-- Procedimientos que orquestan operaciones de negocio de varios pasos con
-- control transaccional explícito (a diferencia de las funciones de
-- 25_functions.sql, que son cómputos sin efectos secundarios).
-- Depende de: 01_core.sql .. 26_triggers.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Aprovisionamiento de un tenant nuevo: clona el rol Administrador y sus
-- permisos desde el tenant SYSTEM (ver 22_seed_data.sql §3).
-- -----------------------------------------------------------------------------

CREATE OR REPLACE PROCEDURE core.sp_provision_new_tenant(
    p_legal_name TEXT, p_slug TEXT, p_contact_email TEXT, p_admin_email TEXT, p_admin_full_name TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_tenant_id UUID;
    v_admin_user_id UUID;
    v_admin_role_id UUID;
BEGIN
    INSERT INTO core.tenants (tenant_id, legal_name, slug, contact_email, status, created_by)
    VALUES (gen_random_uuid(), p_legal_name, p_slug, p_contact_email, 'trial', '00000000-0000-0000-0000-000000000001')
    RETURNING id INTO v_tenant_id;

    UPDATE core.tenants SET tenant_id = v_tenant_id WHERE id = v_tenant_id;

    INSERT INTO core.users (tenant_id, email, full_name, is_active, created_by)
    VALUES (v_tenant_id, p_admin_email, p_admin_full_name, true, '00000000-0000-0000-0000-000000000001')
    RETURNING id INTO v_admin_user_id;

    INSERT INTO core.roles (tenant_id, name, is_system_role, created_by)
    VALUES (v_tenant_id, 'Administrador', true, v_admin_user_id)
    RETURNING id INTO v_admin_role_id;

    -- Clona todos los permisos del rol Administrador plantilla del tenant SYSTEM
    INSERT INTO core.role_permissions (tenant_id, role_id, permission_id, created_by)
    SELECT v_tenant_id, v_admin_role_id, permission_id, v_admin_user_id
    FROM core.role_permissions
    WHERE role_id = '00000000-0000-0000-0000-000000000010' AND deleted_at IS NULL;

    INSERT INTO core.user_roles (tenant_id, user_id, role_id, created_by)
    VALUES (v_tenant_id, v_admin_user_id, v_admin_role_id, v_admin_user_id);

    INSERT INTO core.tenant_subscriptions (tenant_id, plan_code, billing_cycle, starts_at, created_by)
    VALUES (v_tenant_id, 'trial', 'monthly', CURRENT_DATE, v_admin_user_id);

    RAISE NOTICE 'Tenant % aprovisionado con usuario administrador %', v_tenant_id, v_admin_user_id;
END;
$$;
COMMENT ON PROCEDURE core.sp_provision_new_tenant IS 'Alta completa de un tenant nuevo: tenant, usuario admin, rol Administrador con permisos clonados, suscripción trial.';

-- -----------------------------------------------------------------------------
-- 2. Confirmación de un Pedido de Venta: reserva stock, cambia estado,
-- registra historial — todo o nada.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE PROCEDURE sales.sp_confirm_sales_order(p_sales_order_id UUID, p_user_id UUID)
LANGUAGE plpgsql
AS $$
DECLARE
    v_line RECORD;
    v_available NUMERIC;
    v_confirmed_status_id UUID;
BEGIN
    SELECT id INTO v_confirmed_status_id FROM sales.sales_order_status WHERE code = 'confirmed';

    FOR v_line IN SELECT * FROM sales.sales_order_lines WHERE sales_order_id = p_sales_order_id AND deleted_at IS NULL LOOP
        SELECT quantity_available INTO v_available
        FROM inventory.v_available_stock
        WHERE product_id = v_line.product_id
        LIMIT 1;

        IF COALESCE(v_available, 0) < v_line.quantity THEN
            RAISE EXCEPTION 'Stock insuficiente para el producto % (disponible: %, requerido: %)',
                v_line.product_id, COALESCE(v_available, 0), v_line.quantity;
        END IF;

        INSERT INTO inventory.stock_reservations (tenant_id, company_id, product_id, warehouse_id, quantity, source_module, source_entity_id, created_by)
        SELECT so.tenant_id, so.company_id, v_line.product_id, w.id, v_line.quantity, 'sales', p_sales_order_id, p_user_id
        FROM sales.sales_orders so
        JOIN inventory.warehouses w ON w.branch_id = so.branch_id
        WHERE so.id = p_sales_order_id
        LIMIT 1;
    END LOOP;

    UPDATE sales.sales_orders SET status_id = v_confirmed_status_id, updated_by = p_user_id WHERE id = p_sales_order_id;

    INSERT INTO sales.sales_order_status_history (tenant_id, sales_order_id, status_id, created_by)
    SELECT tenant_id, id, v_confirmed_status_id, p_user_id FROM sales.sales_orders WHERE id = p_sales_order_id;

    -- La publicación del evento de dominio SalesOrderConfirmed hacia RabbitMQ
    -- (consumido por inventory, cash, accounting) ocurre en la capa de
    -- aplicación DESPUÉS de que este procedimiento confirma el COMMIT — ver
    -- docs/database/05-estrategia-auditoria.md y
    -- docs/architecture/06-comunicacion-entre-modulos.md. La base de datos
    -- no publica eventos de mensajería directamente.
END;
$$;
COMMENT ON PROCEDURE sales.sp_confirm_sales_order IS 'Confirma un pedido: valida y reserva stock línea por línea, actualiza estado e historial, todo en una única transacción (todo-o-nada).';

-- -----------------------------------------------------------------------------
-- 3. Cierre de período fiscal
-- -----------------------------------------------------------------------------

CREATE OR REPLACE PROCEDURE accounting.sp_close_fiscal_period(p_fiscal_period_id UUID, p_user_id UUID)
LANGUAGE plpgsql
AS $$
DECLARE
    v_unbalanced_count INTEGER;
    v_draft_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_draft_count
    FROM accounting.journal_entries je
    JOIN accounting.journal_entry_status jes ON jes.id = je.status_id
    WHERE je.fiscal_period_id = p_fiscal_period_id AND jes.code = 'draft' AND je.deleted_at IS NULL;

    IF v_draft_count > 0 THEN
        RAISE EXCEPTION 'No se puede cerrar el período: hay % asientos en borrador sin mayorizar', v_draft_count;
    END IF;

    UPDATE accounting.fiscal_periods SET status = 'closed', updated_by = p_user_id WHERE id = p_fiscal_period_id;

    INSERT INTO accounting.period_closing_logs (tenant_id, fiscal_period_id, action, performed_by_user_id, created_by)
    SELECT tenant_id, id, 'closed', p_user_id, p_user_id FROM accounting.fiscal_periods WHERE id = p_fiscal_period_id;
END;
$$;
COMMENT ON PROCEDURE accounting.sp_close_fiscal_period IS 'Cierra un período fiscal tras validar que no queden asientos en borrador. Ver docs/database/07-estrategia-particionamiento.md para la relación con las particiones anuales de journal_entries.';

-- -----------------------------------------------------------------------------
-- 4. Generación de facturas recurrentes vencidas (invocado por
-- core.scheduled_jobs diariamente)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE PROCEDURE sales.sp_generate_due_recurring_invoices(p_as_of_date DATE DEFAULT CURRENT_DATE)
LANGUAGE plpgsql
AS $$
DECLARE
    v_template RECORD;
    v_invoice_id UUID;
    v_draft_status_id UUID;
BEGIN
    SELECT id INTO v_draft_status_id FROM sales.invoice_status WHERE code = 'draft';

    FOR v_template IN
        SELECT * FROM sales.recurring_sale_templates
        WHERE next_generation_date <= p_as_of_date AND deleted_at IS NULL AND is_active
    LOOP
        INSERT INTO sales.invoices (tenant_id, company_id, branch_id, document_number, customer_id, status_id, sales_channel, currency_code, created_by)
        SELECT v_template.tenant_id, v_template.company_id, v_template.branch_id,
               configuration.fn_generate_document_number(
                   (SELECT id FROM configuration.numbering_series WHERE document_type = 'sales.invoice' AND company_id = v_template.company_id LIMIT 1)
               ),
               v_template.customer_id, v_draft_status_id, 'store', 'USD', '00000000-0000-0000-0000-000000000001'
        RETURNING id INTO v_invoice_id;

        INSERT INTO sales.recurring_sale_generations (tenant_id, template_id, invoice_id, created_by)
        VALUES (v_template.tenant_id, v_template.id, v_invoice_id, '00000000-0000-0000-0000-000000000001');

        UPDATE sales.recurring_sale_templates
        SET next_generation_date = CASE frequency
                WHEN 'weekly' THEN next_generation_date + INTERVAL '7 days'
                WHEN 'monthly' THEN next_generation_date + INTERVAL '1 month'
                WHEN 'quarterly' THEN next_generation_date + INTERVAL '3 months'
                WHEN 'annual' THEN next_generation_date + INTERVAL '1 year'
            END
        WHERE id = v_template.id;
    END LOOP;
END;
$$;
COMMENT ON PROCEDURE sales.sp_generate_due_recurring_invoices IS 'Genera las facturas de plantillas recurrentes vencidas a la fecha. Ejecutado diariamente por core.scheduled_jobs.';

-- =============================================================================
-- FIN 27_procedures.sql
-- =============================================================================
