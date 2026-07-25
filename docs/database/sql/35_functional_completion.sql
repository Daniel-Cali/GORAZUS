-- =============================================================================
-- GORAZUS ERP — 35_functional_completion.sql
-- Database Finalization — aplica los gaps funcionales ya especificados y
-- recomendados (no inventados en esta sesión) por auditorías previas del
-- proyecto, consolidados en un solo PR de DDL tal como recomendaba
-- docs/database/FUNCTIONAL_GAPS.md §5.6.3:
--   - FUNCTIONAL_GAPS.md #1 Materiales peligrosos/hoja de seguridad
--   - FUNCTIONAL_GAPS.md #2 País/idioma/timezone en Empresa y Sucursal
--   - FUNCTIONAL_GAPS.md #3 Costo Específico (identificación específica)
--   - FUNCTIONAL_GAPS.md #4 Contratos de Proveedor
--   - INVENTORY_ARCHITECTURE.md §5.2 QR/RFID en código de barras
--   - INVENTORY_ARCHITECTURE.md §5.2 Fecha de fabricación / Peso / Volumen / Dimensiones
--   - INVENTORY_ARCHITECTURE.md §5.2 Obsolescencia (lifecycle_status de producto)
-- Explícitamente NO incluye (fuera de alcance de esta migración, requieren
-- una decisión de arquitectura/negocio previa, no una construcción):
--   - RLS de Empresa/Sucursal (DATABASE_CERTIFICATION.md hallazgo #1) —
--     pendiente de decisión de producto sobre el modelo de multiempresa
--     avanzada, no un gap de estructura faltante.
--   - 185 FK cross-schema (hallazgo #2) — pendiente de ADR, ya gobernado.
--   - core.restore_test_logs sin RLS (hallazgo #4) — 34_rls_hardening.sql
--     ya documenta que es plausiblemente intencional, no se toca.
-- Archivo nuevo — no edita ningún archivo ya existente, mantiene el
-- historial de migración append-only.
-- Depende de: 01_core.sql .. 34_rls_hardening.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Materiales peligrosos / hoja de seguridad (FUNCTIONAL_GAPS.md #1)
-- -----------------------------------------------------------------------------
ALTER TABLE products.products
    ADD COLUMN is_hazardous_material BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN hazmat_classification TEXT,
    ADD COLUMN safety_data_sheet_file_id UUID REFERENCES core.files(id);

COMMENT ON COLUMN products.products.is_hazardous_material IS 'Marca el producto como material peligroso (pinturas, solventes, cemento, químicos) para reportes de cumplimiento regulatorio — FUNCTIONAL_GAPS.md #1.';
COMMENT ON COLUMN products.products.hazmat_classification IS 'Clasificación regulatoria del material peligroso (texto libre — la taxonomía exacta varía por jurisdicción, no se fuerza un catálogo cerrado).';
COMMENT ON COLUMN products.products.safety_data_sheet_file_id IS 'Referencia a la hoja de seguridad (MSDS) almacenada vía core.files — nulo si no aplica.';

CREATE INDEX idx_products_products_hazardous ON products.products (company_id) WHERE is_hazardous_material = true AND deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- 2. País / idioma / timezone en Empresa y Sucursal (FUNCTIONAL_GAPS.md #2)
-- -----------------------------------------------------------------------------
ALTER TABLE core.companies
    ADD COLUMN country_id UUID REFERENCES configuration.countries(id),
    ADD COLUMN language_id UUID REFERENCES configuration.languages(id),
    ADD COLUMN timezone_id UUID REFERENCES configuration.timezones(id);

ALTER TABLE core.branches
    ADD COLUMN country_id UUID REFERENCES configuration.countries(id),
    ADD COLUMN language_id UUID REFERENCES configuration.languages(id),
    ADD COLUMN timezone_id UUID REFERENCES configuration.timezones(id);

COMMENT ON COLUMN core.companies.country_id IS 'País de operación de la Empresa — explícito, no inferido de la jurisdicción fiscal. FUNCTIONAL_GAPS.md #2.';
COMMENT ON COLUMN core.companies.language_id IS 'Idioma preferido de comunicación de la Empresa.';
COMMENT ON COLUMN core.companies.timezone_id IS 'Zona horaria de la Empresa, para reportes/automatizaciones con hora local.';
COMMENT ON COLUMN core.branches.country_id IS 'País de operación de la Sucursal — puede diferir del de la Empresa en grupos multipaís. FUNCTIONAL_GAPS.md #2.';
COMMENT ON COLUMN core.branches.language_id IS 'Idioma preferido de comunicación de la Sucursal.';
COMMENT ON COLUMN core.branches.timezone_id IS 'Zona horaria de la Sucursal — horarios de apertura, vencimientos, comunicación con el cliente.';

CREATE INDEX idx_core_companies_country_id ON core.companies (country_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_core_branches_country_id ON core.branches (country_id) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- 3. Costo Específico — identificación específica (FUNCTIONAL_GAPS.md #3)
-- Solo la columna y el CHECK — la lógica del Domain Service que decida CUÁNDO
-- usar unit_cost en vez del costo FIFO/promedio es código de aplicación, fuera
-- de alcance de una migración de base de datos (ver FUNCTIONAL_GAPS.md #3,
-- "no se recomienda aplicar sin confirmar... el Domain Service necesitaría una
-- rama nueva de lógica, no solo el schema").
-- -----------------------------------------------------------------------------
ALTER TABLE products.products DROP CONSTRAINT products_costing_method_check;
ALTER TABLE products.products ADD CONSTRAINT products_costing_method_check
    CHECK (costing_method = ANY (ARRAY['fifo'::text, 'lifo'::text, 'average'::text, 'standard'::text, 'specific_identification'::text]));

ALTER TABLE inventory.inventory_serials ADD COLUMN unit_cost NUMERIC(18,4);
COMMENT ON COLUMN inventory.inventory_serials.unit_cost IS 'Costo real de adquisición de esta unidad serializada puntual — solo se usa cuando products.costing_method=''specific_identification''. Nulo para el resto de los métodos de costeo. FUNCTIONAL_GAPS.md #3.';

-- -----------------------------------------------------------------------------
-- 4. Contratos de Proveedor (FUNCTIONAL_GAPS.md #4) — tabla nueva
-- -----------------------------------------------------------------------------
CREATE TABLE suppliers.supplier_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id),
    company_id UUID NOT NULL REFERENCES core.companies(id),
    branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id),
    updated_by UUID REFERENCES core.users(id),
    deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1,
    row_version BIGINT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    supplier_id UUID NOT NULL REFERENCES suppliers.suppliers(id),
    contract_number TEXT,
    starts_on DATE NOT NULL,
    ends_on DATE,
    payment_terms_days INTEGER,
    delivery_sla_days INTEGER,
    framework_pricing_notes TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'terminated')),
    CONSTRAINT ck_supplier_contracts_dates CHECK (ends_on IS NULL OR ends_on >= starts_on)
);
COMMENT ON TABLE suppliers.supplier_contracts IS 'Condiciones comerciales negociadas a nivel de relación completa con el proveedor (vigencia, plazo de pago, SLA de entrega, precios marco) — distinto de product_suppliers.lead_time_days, que es por producto individual. FUNCTIONAL_GAPS.md #4.';

CREATE INDEX idx_suppliers_supplier_contracts_supplier_id ON suppliers.supplier_contracts (supplier_id);
CREATE INDEX idx_suppliers_supplier_contracts_tenant_scope ON suppliers.supplier_contracts (tenant_id, company_id, branch_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_suppliers_supplier_contracts_local_id ON suppliers.supplier_contracts (local_id);

-- -----------------------------------------------------------------------------
-- 5. QR / RFID en código de barras (INVENTORY_ARCHITECTURE.md §5.2)
-- -----------------------------------------------------------------------------
ALTER TABLE products.product_barcodes DROP CONSTRAINT product_barcodes_barcode_type_check;
ALTER TABLE products.product_barcodes ADD CONSTRAINT product_barcodes_barcode_type_check
    CHECK (barcode_type = ANY (ARRAY['gtin'::text, 'internal'::text, 'supplier'::text, 'qr'::text, 'rfid'::text]));

-- -----------------------------------------------------------------------------
-- 6. Fecha de fabricación / Peso / Volumen / Dimensiones (INVENTORY_ARCHITECTURE.md §5.2)
-- Tabla 1:1 aparte (no ensancha products.products) — sigue la recomendación
-- explícita del propio documento de arquitectura ("más limpio").
-- -----------------------------------------------------------------------------
CREATE TABLE products.product_physical_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id),
    company_id UUID NOT NULL REFERENCES core.companies(id),
    branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id),
    updated_by UUID REFERENCES core.users(id),
    deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1,
    row_version BIGINT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    product_id UUID NOT NULL UNIQUE REFERENCES products.products(id),
    requires_manufacture_date BOOLEAN NOT NULL DEFAULT false,
    weight_kg NUMERIC(12,4),
    length_cm NUMERIC(12,4),
    width_cm NUMERIC(12,4),
    height_cm NUMERIC(12,4),
    volume_m3 NUMERIC(12,6)
);
COMMENT ON TABLE products.product_physical_attributes IS 'Extensión 1:1 opcional de products.products — peso/dimensiones/exigencia de fecha de fabricación. Solo existe fila para los productos donde estos datos aplican (no todos los productos son bienes físicos). INVENTORY_ARCHITECTURE.md §5.2.';

CREATE INDEX idx_products_product_physical_attributes_tenant_scope ON products.product_physical_attributes (tenant_id, company_id, branch_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_products_product_physical_attributes_local_id ON products.product_physical_attributes (local_id);

-- -----------------------------------------------------------------------------
-- 7. Obsolescencia — estado de ciclo de vida del producto (INVENTORY_ARCHITECTURE.md §5.2)
-- Decisión de diseño tomada acá (el documento original la dejaba abierta):
-- es un atributo del PRODUCTO (catálogo), no del stock físico en un almacén
-- puntual — mismo criterio que costing_method/tracks_serial, ya a nivel de
-- products.products, no de inventory.stock.
-- -----------------------------------------------------------------------------
ALTER TABLE products.products
    ADD COLUMN lifecycle_status TEXT NOT NULL DEFAULT 'active'
        CHECK (lifecycle_status IN ('active', 'discontinued', 'obsolete'));
COMMENT ON COLUMN products.products.lifecycle_status IS 'Ciclo de vida del producto en el catálogo: active (se vende normalmente), discontinued (se deja de reponer, se vende hasta agotar stock), obsolete (no se vende más). Decisión de diseño: es un atributo del producto, no del stock físico. INVENTORY_ARCHITECTURE.md §5.2.';

CREATE INDEX idx_products_products_lifecycle_status ON products.products (company_id, lifecycle_status) WHERE deleted_at IS NULL AND lifecycle_status <> 'active';

-- -----------------------------------------------------------------------------
-- 8. RLS + triggers de auditoría para las 2 tablas nuevas — 26_triggers.sql y
-- 30_backup_restore.sql ya corrieron una sola vez sobre las tablas que
-- existían en ese momento; las tablas nuevas de este script necesitan el
-- mismo tratamiento explícito, replicando exactamente la misma definición.
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    v_schema text;
    v_table text;
BEGIN
    FOR v_schema, v_table IN
        VALUES ('suppliers', 'supplier_contracts'), ('products', 'product_physical_attributes')
    LOOP
        EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', v_schema, v_table);
        EXECUTE format('ALTER TABLE %I.%I FORCE ROW LEVEL SECURITY', v_schema, v_table);
        EXECUTE format(
            'CREATE POLICY tenant_isolation ON %I.%I USING (tenant_id = current_setting(''app.current_tenant_id'', true)::uuid OR tenant_id = ''00000000-0000-0000-0000-000000000000'')',
            v_schema, v_table
        );
        EXECUTE format('CREATE TRIGGER trg_set_audit_fields BEFORE UPDATE ON %I.%I FOR EACH ROW EXECUTE FUNCTION core.fn_set_audit_fields()', v_schema, v_table);
        EXECUTE format('CREATE TRIGGER trg_audit_log AFTER INSERT OR UPDATE OR DELETE ON %I.%I FOR EACH ROW EXECUTE FUNCTION core.fn_audit_log()', v_schema, v_table);
    END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 9. Verificación — debe devolver 0 filas en cada chequeo.
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    v_bad_fk int;
    v_bad_idx int;
    v_unforced int;
BEGIN
    SELECT count(*) INTO v_bad_fk FROM pg_constraint WHERE contype = 'f' AND NOT convalidated;
    IF v_bad_fk <> 0 THEN
        RAISE EXCEPTION '35_functional_completion: % FK sin validar', v_bad_fk;
    END IF;

    SELECT count(*) INTO v_bad_idx FROM pg_index WHERE NOT indisvalid;
    IF v_bad_idx <> 0 THEN
        RAISE EXCEPTION '35_functional_completion: % indices invalidos', v_bad_idx;
    END IF;

    SELECT count(*) INTO v_unforced
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname IN ('supplier_contracts', 'product_physical_attributes')
      AND NOT (c.relrowsecurity AND c.relforcerowsecurity);
    IF v_unforced <> 0 THEN
        RAISE EXCEPTION '35_functional_completion: % tablas nuevas sin RLS forzado', v_unforced;
    END IF;

    RAISE NOTICE '35_functional_completion: OK';
END $$;
