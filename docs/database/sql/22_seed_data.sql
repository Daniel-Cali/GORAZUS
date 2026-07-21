-- =============================================================================
-- GORAZUS ERP — 22_seed_data.sql
-- Datos semilla: bootstrap del sistema + catálogos base
-- Depende de: 01_core.sql .. 21_configuration.sql (los 494 tablas ya existen)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. BOOTSTRAP: tenant SYSTEM y usuario SYSTEM
-- Resuelve la dependencia circular tenant↔user documentada en 01_core.sql.
-- El sentinela '00000000-0000-0000-0000-000000000000' es EL tenant global
-- usado por todos los catálogos compartidos entre tenants (ver
-- docs/database/01-modelo-conceptual.md §1.1).
-- -----------------------------------------------------------------------------

INSERT INTO core.tenants (id, tenant_id, legal_name, slug, contact_email, status, created_by)
VALUES ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000',
        'GORAZUS System', 'system', 'system@gorazus.internal', 'active', NULL);

INSERT INTO core.users (id, tenant_id, email, full_name, is_system_account, is_active, created_by)
VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000',
        'system@gorazus.internal', 'GORAZUS System', true, true, NULL);

-- Retroactivamente, el tenant SYSTEM queda auditado por el usuario SYSTEM
UPDATE core.tenants SET created_by = '00000000-0000-0000-0000-000000000001'
WHERE id = '00000000-0000-0000-0000-000000000000';

-- -----------------------------------------------------------------------------
-- 2. Catálogo de permisos (core.permissions) — uno por <módulo>.<acción>
-- Generado mecánicamente a partir de la convención fijada en
-- docs/architecture/09-seguridad-y-multiempresa.md §2 y
-- docs/menus/00-convenciones.md §3. Se listan las acciones estándar; cada
-- módulo puede tener adicionales específicas agregadas por el equipo
-- funcional cuando se implemente esa pantalla concreta (ver memoria de
-- proyecto: no se construyen permisos para capacidades que no existen).
-- -----------------------------------------------------------------------------

DO $$
DECLARE
    v_module TEXT;
    v_action TEXT;
    v_modules TEXT[] := ARRAY['core','security','customers','suppliers','products','inventory',
                               'sales','purchases','cash','banks','accounting','taxes','crm',
                               'hr','payroll','services','projects','assets','reports','bi','configuration'];
    v_actions TEXT[] := ARRAY['ver','crear','editar','confirmar','anular','aprobar','exportar','configurar'];
BEGIN
    FOREACH v_module IN ARRAY v_modules LOOP
        FOREACH v_action IN ARRAY v_actions LOOP
            INSERT INTO core.permissions (tenant_id, code, module_code, action_code, created_by)
            VALUES ('00000000-0000-0000-0000-000000000000', v_module || '.' || v_action, v_module, v_action,
                    '00000000-0000-0000-0000-000000000001')
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 3. Rol de sistema "Administrador" con todos los permisos — plantilla que
-- cada tenant nuevo clona al aprovisionarse (ver 27_procedures.sql,
-- sp_provision_new_tenant).
-- -----------------------------------------------------------------------------

INSERT INTO core.roles (id, tenant_id, name, is_system_role, created_by)
VALUES ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000000',
        'Administrador', true, '00000000-0000-0000-0000-000000000001');

INSERT INTO core.role_permissions (tenant_id, role_id, permission_id, created_by)
SELECT '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000010', id, '00000000-0000-0000-0000-000000000001'
FROM core.permissions WHERE tenant_id = '00000000-0000-0000-0000-000000000000';

-- -----------------------------------------------------------------------------
-- 4. Catálogos de estado (patrón _status) — ver docs/database/02-modelo-logico.md §1.1
-- -----------------------------------------------------------------------------

INSERT INTO sales.quote_status (tenant_id, code, is_final, created_by) VALUES
    ('00000000-0000-0000-0000-000000000000','draft', false, '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','sent', false, '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','accepted', true, '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','rejected', true, '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','expired', true, '00000000-0000-0000-0000-000000000001');

INSERT INTO sales.sales_order_status (tenant_id, code, is_final, created_by) VALUES
    ('00000000-0000-0000-0000-000000000000','draft', false, '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','confirmed', false, '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','reserved', false, '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','delivered', false, '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','invoiced', true, '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','cancelled', true, '00000000-0000-0000-0000-000000000001');

INSERT INTO sales.invoice_status (tenant_id, code, is_final, created_by) VALUES
    ('00000000-0000-0000-0000-000000000000','draft', false, '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','confirmed', false, '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','paid', true, '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','partially_paid', false, '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','voided', true, '00000000-0000-0000-0000-000000000001');

INSERT INTO purchases.purchase_order_status (tenant_id, code, is_final, created_by) VALUES
    ('00000000-0000-0000-0000-000000000000','draft', false, '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','confirmed', false, '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','partially_received', false, '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','received', true, '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','cancelled', true, '00000000-0000-0000-0000-000000000001');

INSERT INTO accounting.journal_entry_status (tenant_id, code, created_by) VALUES
    ('00000000-0000-0000-0000-000000000000','draft', '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','posted', '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','reversed', '00000000-0000-0000-0000-000000000001');

INSERT INTO inventory.production_order_status (tenant_id, code, is_final, created_by) VALUES
    ('00000000-0000-0000-0000-000000000000','planned', false, '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','released', false, '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','in_progress', false, '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','closed', true, '00000000-0000-0000-0000-000000000001');

INSERT INTO services.service_order_status (tenant_id, code, is_final, created_by) VALUES
    ('00000000-0000-0000-0000-000000000000','open', false, '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','assigned', false, '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','in_progress', false, '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','closed', true, '00000000-0000-0000-0000-000000000001');

INSERT INTO projects.project_status (tenant_id, code, is_final, created_by) VALUES
    ('00000000-0000-0000-0000-000000000000','planned', false, '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','in_progress', false, '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','completed', true, '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','cancelled', true, '00000000-0000-0000-0000-000000000001');

-- -----------------------------------------------------------------------------
-- 5. Atributos de producto base (Color, Talla, Material) — ver
-- docs/database/logico/05-products.md, patrón de consolidación.
-- -----------------------------------------------------------------------------

INSERT INTO products.product_attributes (id, tenant_id, code, created_by) VALUES
    ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000000', 'color', '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000000', 'size', '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000000', 'material', '00000000-0000-0000-0000-000000000001');

-- -----------------------------------------------------------------------------
-- 6. Catálogos de configuración base: monedas, formas de pago, idiomas
-- -----------------------------------------------------------------------------

INSERT INTO configuration.currencies (tenant_id, iso_code, symbol, decimal_places, created_by) VALUES
    ('00000000-0000-0000-0000-000000000000','USD','$',2,'00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','EUR','€',2,'00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','DOP','RD$',2,'00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','MXN','$',2,'00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','ARS','$',2,'00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','CLP','$',0,'00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','COP','$',2,'00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','PEN','S/',2,'00000000-0000-0000-0000-000000000001');

INSERT INTO configuration.payment_forms (tenant_id, code, created_by) VALUES
    ('00000000-0000-0000-0000-000000000000','cash','00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','check','00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','transfer','00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','card','00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','credit','00000000-0000-0000-0000-000000000001');

INSERT INTO configuration.languages (tenant_id, iso_code, created_by) VALUES
    ('00000000-0000-0000-0000-000000000000','es','00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','en','00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000000','pt','00000000-0000-0000-0000-000000000001');

-- Nota: catálogos exhaustivos de países/estados/municipios/monedas ISO
-- completos, planes de cuentas por país y tablas de retención fiscal se
-- cargan desde un dataset de referencia versionado aparte (no en este
-- archivo) — mantenerlos en SQL a mano sería inmanejable a largo plazo y
-- quedaría desactualizado; se gestionan como fixtures de datos maestros
-- versionados en el pipeline de despliegue de cada tenant nuevo.

-- =============================================================================
-- FIN 22_seed_data.sql
-- =============================================================================
