-- =============================================================================
-- GORAZUS ERP — 06_inventory.sql
-- Módulo: Inventory
-- Schema: inventory
-- Depende de: 01_core.sql, 05_products.sql
-- Documentación funcional: docs/database/logico/06-inventory.md
-- Único módulo autorizado a escribir sobre stock (ver docs/architecture/
-- 06-comunicacion-entre-modulos.md). Kardex = vista sobre stock_movements
-- (24_views.sql), no tabla base.
-- Patrón universal de 18 columnas: ver 01_core.sql (encabezado).
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS inventory;

CREATE TABLE inventory.warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID NOT NULL REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    name TEXT NOT NULL, code TEXT NOT NULL, warehouse_type TEXT NOT NULL DEFAULT 'physical' CHECK (warehouse_type IN ('physical', 'virtual'))
);
COMMENT ON TABLE inventory.warehouses IS 'Almacén/depósito físico o virtual, pertenece a una sucursal.';
CREATE UNIQUE INDEX uq_inventory_warehouses_code ON inventory.warehouses (branch_id, code) WHERE deleted_at IS NULL;

CREATE TABLE inventory.warehouse_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    warehouse_id UUID NOT NULL REFERENCES inventory.warehouses(id), name TEXT NOT NULL,
    zone_function TEXT NOT NULL CHECK (zone_function IN ('receiving', 'storage', 'picking', 'shipping'))
);
COMMENT ON TABLE inventory.warehouse_zones IS 'Zona funcional del almacén.';

CREATE TABLE inventory.warehouse_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    zone_id UUID NOT NULL REFERENCES inventory.warehouse_zones(id), code TEXT NOT NULL, parent_location_id UUID REFERENCES inventory.warehouse_locations(id)
);
COMMENT ON TABLE inventory.warehouse_locations IS 'Ubicación jerárquica dentro de una zona (pasillo→estante→bin, auto-referenciada).';

CREATE TABLE inventory.putaway_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    warehouse_id UUID NOT NULL REFERENCES inventory.warehouses(id), product_category_id UUID REFERENCES products.product_categories(id),
    target_zone_id UUID NOT NULL REFERENCES inventory.warehouse_zones(id), priority SMALLINT NOT NULL DEFAULT 0
);
COMMENT ON TABLE inventory.putaway_rules IS 'Regla de ubicación automática al recibir mercadería.';

CREATE TABLE inventory.picking_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    warehouse_id UUID NOT NULL REFERENCES inventory.warehouses(id), strategy TEXT NOT NULL CHECK (strategy IN ('fifo_physical', 'nearest_location', 'by_route'))
);
COMMENT ON TABLE inventory.picking_rules IS 'Regla de secuencia de picking.';

CREATE TABLE inventory.replenishment_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    warehouse_id UUID NOT NULL REFERENCES inventory.warehouses(id), product_id UUID NOT NULL REFERENCES products.products(id),
    min_quantity NUMERIC(18,6) NOT NULL, max_quantity NUMERIC(18,6) NOT NULL
);
COMMENT ON TABLE inventory.replenishment_rules IS 'Regla de reposición automática entre zona de reserva y zona de picking.';

CREATE TABLE inventory.cycle_count_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    zone_id UUID NOT NULL REFERENCES inventory.warehouse_zones(id), frequency_days INTEGER NOT NULL, next_run_date DATE
);
COMMENT ON TABLE inventory.cycle_count_schedules IS 'Calendario de conteo cíclico recurrente por zona.';

CREATE TABLE inventory.stock_movement_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    code TEXT NOT NULL, direction TEXT NOT NULL CHECK (direction IN ('in', 'out'))
);
COMMENT ON TABLE inventory.stock_movement_types IS 'Catálogo de tipos de movimiento (compra, venta, transferencia, ajuste, consumo de producción...).';
CREATE UNIQUE INDEX uq_inventory_movement_types_code ON inventory.stock_movement_types (code) WHERE deleted_at IS NULL;

CREATE TABLE inventory.stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    product_id UUID NOT NULL REFERENCES products.products(id), warehouse_id UUID NOT NULL REFERENCES inventory.warehouses(id),
    location_id UUID REFERENCES inventory.warehouse_locations(id), quantity_on_hand NUMERIC(18,6) NOT NULL DEFAULT 0,
    quantity_reserved NUMERIC(18,6) NOT NULL DEFAULT 0
);
COMMENT ON TABLE inventory.stock IS 'Saldo actual por producto+almacén+ubicación. No particionada (crece con # de SKUs×almacenes, no con el tiempo).';
CREATE UNIQUE INDEX uq_inventory_stock ON inventory.stock (product_id, warehouse_id, COALESCE(location_id, '00000000-0000-0000-0000-000000000000')) WHERE deleted_at IS NULL;

CREATE TABLE inventory.stock_movements (
    id UUID NOT NULL DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    product_id UUID NOT NULL REFERENCES products.products(id), warehouse_id UUID NOT NULL REFERENCES inventory.warehouses(id),
    movement_type_id UUID NOT NULL REFERENCES inventory.stock_movement_types(id), quantity NUMERIC(18,6) NOT NULL, unit_cost NUMERIC(18,4),
    source_module TEXT, source_entity_id UUID,
    -- PK/UNIQUE deben incluir la columna de partición (created_at)
    PRIMARY KEY (id, created_at), UNIQUE (local_id, created_at)
) PARTITION BY RANGE (created_at);
COMMENT ON TABLE inventory.stock_movements IS 'Todo movimiento de inventario — fuente de verdad del kardex (ver vista en 24_views.sql). Particionada mensualmente, ver 29_partitioning.sql.';
CREATE INDEX idx_inventory_stock_movements_product ON inventory.stock_movements (product_id, warehouse_id, created_at);

CREATE TABLE inventory.stock_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    product_id UUID NOT NULL REFERENCES products.products(id), warehouse_id UUID NOT NULL REFERENCES inventory.warehouses(id),
    quantity NUMERIC(18,6) NOT NULL, source_module TEXT NOT NULL, source_entity_id UUID NOT NULL, released_at TIMESTAMPTZ
);
COMMENT ON TABLE inventory.stock_reservations IS 'Cantidad reservada para un pedido de venta/orden de producción (polimórfico).';

CREATE TABLE inventory.stock_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    source_warehouse_id UUID NOT NULL REFERENCES inventory.warehouses(id), destination_warehouse_id UUID NOT NULL REFERENCES inventory.warehouses(id),
    document_number TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_transit', 'received', 'cancelled'))
);
COMMENT ON TABLE inventory.stock_transfers IS 'Encabezado de transferencia entre almacenes.';

CREATE TABLE inventory.stock_transfer_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    transfer_id UUID NOT NULL REFERENCES inventory.stock_transfers(id), product_id UUID NOT NULL REFERENCES products.products(id), quantity NUMERIC(18,6) NOT NULL
);
COMMENT ON TABLE inventory.stock_transfer_lines IS 'Línea de producto/cantidad transferida.';

CREATE TABLE inventory.stock_adjustment_reasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    name TEXT NOT NULL
);
COMMENT ON TABLE inventory.stock_adjustment_reasons IS 'Catálogo de motivos de ajuste.';

CREATE TABLE inventory.stock_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    warehouse_id UUID NOT NULL REFERENCES inventory.warehouses(id), reason_id UUID NOT NULL REFERENCES inventory.stock_adjustment_reasons(id),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed'))
);
COMMENT ON TABLE inventory.stock_adjustments IS 'Encabezado de ajuste de inventario.';

CREATE TABLE inventory.stock_adjustment_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    adjustment_id UUID NOT NULL REFERENCES inventory.stock_adjustments(id), product_id UUID NOT NULL REFERENCES products.products(id),
    previous_quantity NUMERIC(18,6) NOT NULL, new_quantity NUMERIC(18,6) NOT NULL
);
COMMENT ON TABLE inventory.stock_adjustment_lines IS 'Línea de ajuste (cantidad anterior/nueva).';

CREATE TABLE inventory.physical_counts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    warehouse_id UUID NOT NULL REFERENCES inventory.warehouses(id), scheduled_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed'))
);
COMMENT ON TABLE inventory.physical_counts IS 'Campaña de toma física programada.';

CREATE TABLE inventory.physical_count_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    physical_count_id UUID NOT NULL REFERENCES inventory.physical_counts(id), product_id UUID NOT NULL REFERENCES products.products(id),
    system_quantity NUMERIC(18,6) NOT NULL, counted_quantity NUMERIC(18,6)
);
COMMENT ON TABLE inventory.physical_count_lines IS 'Cantidad contada vs. cantidad en sistema por producto.';

CREATE TABLE inventory.goods_issue_reasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    name TEXT NOT NULL  -- daño, muestra, uso interno, donación
);
COMMENT ON TABLE inventory.goods_issue_reasons IS 'Catálogo de motivos de salida no comercial.';

CREATE TABLE inventory.goods_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    warehouse_id UUID NOT NULL REFERENCES inventory.warehouses(id), source_module TEXT, source_entity_id UUID
);
COMMENT ON TABLE inventory.goods_receipts IS 'Encabezado de entrada (recepción de compra, devolución de cliente).';

CREATE TABLE inventory.goods_receipt_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    receipt_id UUID NOT NULL REFERENCES inventory.goods_receipts(id), product_id UUID NOT NULL REFERENCES products.products(id),
    quantity NUMERIC(18,6) NOT NULL, unit_cost NUMERIC(18,4)
);
COMMENT ON TABLE inventory.goods_receipt_lines IS 'Línea de entrada.';

CREATE TABLE inventory.goods_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    warehouse_id UUID NOT NULL REFERENCES inventory.warehouses(id), reason_id UUID REFERENCES inventory.goods_issue_reasons(id),
    source_module TEXT, source_entity_id UUID
);
COMMENT ON TABLE inventory.goods_issues IS 'Encabezado de salida (venta, muestra, merma, uso interno).';

CREATE TABLE inventory.goods_issue_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    issue_id UUID NOT NULL REFERENCES inventory.goods_issues(id), product_id UUID NOT NULL REFERENCES products.products(id), quantity NUMERIC(18,6) NOT NULL
);
COMMENT ON TABLE inventory.goods_issue_lines IS 'Línea de salida.';

CREATE TABLE inventory.fifo_cost_layers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    product_id UUID NOT NULL REFERENCES products.products(id), warehouse_id UUID NOT NULL REFERENCES inventory.warehouses(id),
    source_receipt_line_id UUID REFERENCES inventory.goods_receipt_lines(id), original_quantity NUMERIC(18,6) NOT NULL,
    remaining_quantity NUMERIC(18,6) NOT NULL, unit_cost NUMERIC(18,4) NOT NULL
);
COMMENT ON TABLE inventory.fifo_cost_layers IS 'Capa de costo de entrada pendiente de consumir (PEPS).';

CREATE TABLE inventory.lifo_cost_layers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    product_id UUID NOT NULL REFERENCES products.products(id), warehouse_id UUID NOT NULL REFERENCES inventory.warehouses(id),
    original_quantity NUMERIC(18,6) NOT NULL, remaining_quantity NUMERIC(18,6) NOT NULL, unit_cost NUMERIC(18,4) NOT NULL
);
COMMENT ON TABLE inventory.lifo_cost_layers IS 'Capa de costo de entrada pendiente de consumir (UEPS).';

CREATE TABLE inventory.average_cost_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    product_id UUID NOT NULL REFERENCES products.products(id), warehouse_id UUID NOT NULL REFERENCES inventory.warehouses(id), new_average_cost NUMERIC(18,4) NOT NULL
);
COMMENT ON TABLE inventory.average_cost_history IS 'Snapshot de costo promedio ponderado tras cada movimiento.';

CREATE TABLE inventory.inventory_serials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    product_id UUID NOT NULL REFERENCES products.products(id), warehouse_id UUID REFERENCES inventory.warehouses(id),
    serial_number TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'sold', 'under_warranty', 'scrapped'))
);
COMMENT ON TABLE inventory.inventory_serials IS 'Instancia de número de serie con su estado.';
CREATE UNIQUE INDEX uq_inventory_serials ON inventory.inventory_serials (product_id, serial_number) WHERE deleted_at IS NULL;

CREATE TABLE inventory.inventory_lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    product_id UUID NOT NULL REFERENCES products.products(id), warehouse_id UUID REFERENCES inventory.warehouses(id),
    lot_number TEXT NOT NULL, expiry_date DATE, remaining_quantity NUMERIC(18,6) NOT NULL DEFAULT 0
);
COMMENT ON TABLE inventory.inventory_lots IS 'Instancia de lote/batch con fecha de vencimiento.';
CREATE UNIQUE INDEX uq_inventory_lots ON inventory.inventory_lots (product_id, lot_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_inventory_lots_expiry ON inventory.inventory_lots (expiry_date) WHERE deleted_at IS NULL AND remaining_quantity > 0;

CREATE TABLE inventory.production_order_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    code TEXT NOT NULL, is_final BOOLEAN NOT NULL DEFAULT false
);
COMMENT ON TABLE inventory.production_order_status IS 'Catálogo de estados (planificada, liberada, en curso, cerrada).';

CREATE TABLE inventory.production_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID NOT NULL REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    bom_id UUID NOT NULL REFERENCES products.bill_of_materials(id), warehouse_id UUID NOT NULL REFERENCES inventory.warehouses(id),
    status_id UUID NOT NULL REFERENCES inventory.production_order_status(id), planned_quantity NUMERIC(18,6) NOT NULL, planned_date DATE
);
COMMENT ON TABLE inventory.production_orders IS 'Orden de fabricación planificada.';

CREATE TABLE inventory.production_order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    production_order_id UUID NOT NULL REFERENCES inventory.production_orders(id), status_id UUID NOT NULL REFERENCES inventory.production_order_status(id)
);
COMMENT ON TABLE inventory.production_order_status_history IS 'Historial de transición de estado.';

CREATE TABLE inventory.production_order_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    production_order_id UUID NOT NULL REFERENCES inventory.production_orders(id), component_product_id UUID NOT NULL REFERENCES products.products(id),
    planned_quantity NUMERIC(18,6) NOT NULL
);
COMMENT ON TABLE inventory.production_order_components IS 'Consumo planificado (copiado del BOM al crear la orden).';

CREATE TABLE inventory.production_order_outputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    production_order_id UUID NOT NULL REFERENCES inventory.production_orders(id), product_id UUID NOT NULL REFERENCES products.products(id), quantity NUMERIC(18,6) NOT NULL
);
COMMENT ON TABLE inventory.production_order_outputs IS 'Producto terminado ingresado al cerrar la orden.';

CREATE TABLE inventory.production_consumptions (
    id UUID NOT NULL DEFAULT gen_random_uuid(), local_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
    tenant_id UUID NOT NULL REFERENCES core.tenants(id), company_id UUID REFERENCES core.companies(id), branch_id UUID REFERENCES core.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES core.users(id), updated_by UUID REFERENCES core.users(id), deleted_by UUID REFERENCES core.users(id),
    version INTEGER NOT NULL DEFAULT 1, row_version BIGINT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED, observations TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    production_order_id UUID NOT NULL REFERENCES inventory.production_orders(id), component_product_id UUID NOT NULL REFERENCES products.products(id),
    actual_quantity NUMERIC(18,6) NOT NULL,
    -- PK/UNIQUE deben incluir la columna de partición (created_at)
    PRIMARY KEY (id, created_at), UNIQUE (local_id, created_at)
) PARTITION BY RANGE (created_at);
COMMENT ON TABLE inventory.production_consumptions IS 'Consumo real registrado (para comparar contra lo planificado). Particionada mensualmente, ver 29_partitioning.sql — ver docs/architecture/38-modulo-production.md §4 para el razonamiento (tabla de hechos append-only, mismo patrón que stock_movements).';

-- =============================================================================
-- FIN 06_inventory.sql — 34 tablas.
-- Notas de portabilidad: PARTITION BY RANGE existe en MySQL/MariaDB/SQL Server
-- con sintaxis propia; ver 07-estrategia-particionamiento.md §7.
-- =============================================================================
