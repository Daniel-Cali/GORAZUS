-- Inventario Parte 05, Prompt 1 (Foundation Completion).
--
-- Gap real verificado antes de codear (mission "only create SQL migration
-- if a verified schema gap exists"):
--
-- 1. stock_transfer_lines / stock_adjustment_lines / physical_count_lines
--    no tenian lot_id -- mismo criterio que goods_receipt_lines/
--    goods_issue_lines (46_stock_movements_lot_serial_traceability.sql):
--    una linea con lote es 1:1 (el lote agrupa cantidad); series NO se
--    agregan a estas lineas (una linea serializada de cantidad N produce N
--    series individuales, se manejan via metadata.serialNumbers + un
--    movimiento/serie, igual que Recepciones/Salidas).
--
-- 2. stock_reservations NO tiene tabla de lineas (una fila = un producto
--    reservado) -- lot_id/serial_id van directo en la fila.
--
-- 3. physical_count_lines tambien recibe serial_id ademas de lot_id: contar
--    "por serie" (regla de la mision) es contar una unidad fisica puntual,
--    no una cantidad agrupable -- a diferencia de las lineas de
--    recepcion/salida/transferencia/ajuste, una linea de conteo SI puede
--    representar una sola serie 1:1 (no genera movimientos, solo compara
--    system_quantity vs counted_quantity).
--
-- 4. cycle_count_schedules solo soportaba "by zone" (zone_id). La mision
--    pide "by warehouse/zone/location/product class" -- warehouse ya se
--    deriva de zone_id via warehouse_zones.warehouse_id (sin gap real ahi).
--    location y product class SI son gaps reales: se agregan location_id
--    (nullable, granularidad mas fina que zone_id) y product_category_id
--    (nullable, cross-schema hacia products.product_categories, mismo
--    patron sin relacion Prisma que ya usan todos los product_id de este
--    schema).
--
-- Todo nullable y aditivo -- cero impacto en filas/movimientos existentes.

ALTER TABLE inventory.stock_transfer_lines
  ADD COLUMN lot_id UUID NULL REFERENCES inventory.inventory_lots (id);

CREATE INDEX idx_inventory_stock_transfer_lines_lot_id
  ON inventory.stock_transfer_lines (lot_id)
  WHERE lot_id IS NOT NULL;

ALTER TABLE inventory.stock_adjustment_lines
  ADD COLUMN lot_id UUID NULL REFERENCES inventory.inventory_lots (id);

CREATE INDEX idx_inventory_stock_adjustment_lines_lot_id
  ON inventory.stock_adjustment_lines (lot_id)
  WHERE lot_id IS NOT NULL;

ALTER TABLE inventory.stock_reservations
  ADD COLUMN lot_id UUID NULL REFERENCES inventory.inventory_lots (id),
  ADD COLUMN serial_id UUID NULL REFERENCES inventory.inventory_serials (id);

CREATE INDEX idx_inventory_stock_reservations_lot_id
  ON inventory.stock_reservations (lot_id)
  WHERE lot_id IS NOT NULL;

CREATE INDEX idx_inventory_stock_reservations_serial_id
  ON inventory.stock_reservations (serial_id)
  WHERE serial_id IS NOT NULL;

-- "Prevent double reservation of serials" (regla de negocio explicita de la
-- mision): una serie puede tener muchas reservas HISTORICAS (liberadas),
-- pero nunca dos reservas ACTIVAS al mismo tiempo. Indice unico parcial —
-- mismo patron que uq_inventory_inventory_lots_identity/
-- uq_inventory_inventory_serials_identity -- es la garantia real bajo
-- concurrencia (dos intentos concurrentes de reservar la misma serie
-- serializan sobre este indice; el segundo falla con unique_violation,
-- traducido a SerieYaReservadaException en ReservasService).
CREATE UNIQUE INDEX uq_inventory_stock_reservations_active_serial
  ON inventory.stock_reservations (serial_id)
  WHERE serial_id IS NOT NULL AND released_at IS NULL AND deleted_at IS NULL;

ALTER TABLE inventory.physical_count_lines
  ADD COLUMN lot_id UUID NULL REFERENCES inventory.inventory_lots (id),
  ADD COLUMN serial_id UUID NULL REFERENCES inventory.inventory_serials (id);

CREATE INDEX idx_inventory_physical_count_lines_lot_id
  ON inventory.physical_count_lines (lot_id)
  WHERE lot_id IS NOT NULL;

CREATE INDEX idx_inventory_physical_count_lines_serial_id
  ON inventory.physical_count_lines (serial_id)
  WHERE serial_id IS NOT NULL;

ALTER TABLE inventory.cycle_count_schedules
  ADD COLUMN location_id UUID NULL REFERENCES inventory.warehouse_locations (id),
  ADD COLUMN product_category_id UUID NULL REFERENCES products.product_categories (id);

CREATE INDEX idx_inventory_cycle_count_schedules_location_id
  ON inventory.cycle_count_schedules (location_id)
  WHERE location_id IS NOT NULL;

CREATE INDEX idx_inventory_cycle_count_schedules_product_category_id
  ON inventory.cycle_count_schedules (product_category_id)
  WHERE product_category_id IS NOT NULL;
