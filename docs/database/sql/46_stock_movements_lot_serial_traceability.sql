-- Inventario Parte 05, Subfase 3 (Lotes y Series de Inventario).
--
-- Gap real detectado antes de codear (schema certificado revisado primero,
-- ver mission "Stop and evaluate migration. Do not silently change schema"):
--
-- 1. inventory.stock_movements no tenia lot_id/serial_id -- un movimiento
--    IN/OUT no podia referenciar de que lote o serie provenia/hacia donde
--    iba. Columnas nullable y aditivas: movimientos de productos SIN control
--    de lote/serie (la mayoria) siguen con ambas columnas en NULL, sin
--    romper nada existente (Recepciones/Salidas Subfase 1/2, Transferencias,
--    Ajustes, Conteos, POS checkout).
--
-- 2. inventory.stock_movements esta particionada mensualmente por created_at
--    (29_partitioning.sql) -- un indice UNICO sobre ella tendria que incluir
--    la columna de particion (mismo limite ya documentado en
--    45_movement_idempotency_keys.sql). lot_id/serial_id NO necesitan ser
--    unicos aqui (un lote/serie puede tener muchos movimientos), asi que
--    alcanza con indices simples -- no aplica el problema de 45_.
--
-- 3. inventory.goods_receipt_lines/goods_issue_lines no tenian forma de
--    declarar a que lote pertenece cada linea. lot_id ahi es 1:1 por linea
--    (un lote agrupa una cantidad, igual que "remaining_quantity" en
--    inventory_lots). serial_id NO se agrega a las lineas a proposito: una
--    linea serializada de cantidad N produce N series individuales (regla
--    "una serie = una unidad fisica"), cada una con su propio
--    stock_movements.serial_id (quantity=1) -- una columna serial_id en la
--    linea no podria representar N series. Ver
--    RecepcionesInventarioService/SalidasInventarioService.
--
-- 4. inventory_lots/inventory_serials no tenian restriccion de unicidad de
--    identidad -- nada impedia crear dos filas para el mismo
--    (tenant, producto, numero de lote) o el mismo (tenant, numero de
--    serie). Reglas de negocio de la mision: "Cannot duplicate lot
--    identity" / "Serial unique". Se agregan indices unicos parciales
--    (WHERE deleted_at IS NULL, mismo patron que 44_/45_) para que el motor
--    de find-or-create (InventoryLotRepositoryPrisma/InventorySerialRepositoryPrisma)
--    tenga una restriccion real contra la cual apoyarse bajo concurrencia.
--
-- ADR-INV-003 (motor de movimientos) · ISSUE-25 (estado derivado) ·
-- Inventario Parte 05 Subfase 3.

ALTER TABLE inventory.stock_movements
  ADD COLUMN lot_id UUID NULL REFERENCES inventory.inventory_lots (id),
  ADD COLUMN serial_id UUID NULL REFERENCES inventory.inventory_serials (id);

CREATE INDEX idx_inventory_stock_movements_lot_id
  ON inventory.stock_movements (lot_id)
  WHERE lot_id IS NOT NULL;

CREATE INDEX idx_inventory_stock_movements_serial_id
  ON inventory.stock_movements (serial_id)
  WHERE serial_id IS NOT NULL;

ALTER TABLE inventory.goods_receipt_lines
  ADD COLUMN lot_id UUID NULL REFERENCES inventory.inventory_lots (id);

ALTER TABLE inventory.goods_issue_lines
  ADD COLUMN lot_id UUID NULL REFERENCES inventory.inventory_lots (id);

CREATE INDEX idx_inventory_goods_receipt_lines_lot_id
  ON inventory.goods_receipt_lines (lot_id)
  WHERE lot_id IS NOT NULL;

CREATE INDEX idx_inventory_goods_issue_lines_lot_id
  ON inventory.goods_issue_lines (lot_id)
  WHERE lot_id IS NOT NULL;

-- Identidad de lote: mismo tenant + producto + numero de lote = el mismo
-- lote (find-or-create en InventoryLotRepositoryPrisma), nunca una fila
-- duplicada. Recibir el mismo lote dos veces esta PERMITIDO a nivel de
-- negocio (entregas parciales del proveedor) -- lo que esta prohibido es
-- que existan dos registros distintos para la misma identidad.
CREATE UNIQUE INDEX uq_inventory_inventory_lots_identity
  ON inventory.inventory_lots (tenant_id, product_id, lot_number)
  WHERE deleted_at IS NULL;

-- Identidad de serie: unica por tenant -- una serie representa una unidad
-- fisica, nunca puede existir dos veces (independiente del producto: un
-- numero de serie repetido entre productos distintos ya seria un error de
-- captura, no un caso valido).
CREATE UNIQUE INDEX uq_inventory_inventory_serials_identity
  ON inventory.inventory_serials (tenant_id, serial_number)
  WHERE deleted_at IS NULL;

COMMENT ON COLUMN inventory.stock_movements.lot_id IS
  'Inventario Parte 05 Subfase 3: lote de origen/destino del movimiento. NULL para productos sin tracks_lot.';
COMMENT ON COLUMN inventory.stock_movements.serial_id IS
  'Inventario Parte 05 Subfase 3: serie de origen/destino del movimiento (quantity siempre 1 cuando no es NULL). NULL para productos sin tracks_serial.';
