-- ISSUE-07 (Inventario): idempotencia en inventory.stock_movements vía tabla ledger separada.
--
-- inventory.stock_movements está particionada mensualmente por created_at (29_partitioning.sql).
-- Postgres exige que todo índice único sobre una tabla particionada incluya la columna de
-- partición — un índice único (tenant_id, idempotency_key) directo sobre stock_movements no es
-- válido, e incluir created_at en el índice no detectaría reintentos que caigan en particiones
-- distintas. Solución: una tabla no particionada dedicada a reservar la clave antes de crear el
-- movimiento real. La reserva (INSERT) es el mecanismo de exclusión mutua real bajo concurrencia
-- — Postgres serializa dos INSERT concurrentes con la misma (tenant_id, idempotency_key) vía el
-- índice único; el segundo espera al primero y luego falla con unique_violation si el primero
-- confirmó, exactamente el comportamiento pedido.
--
-- movement_id es UUID simple SIN foreign key real hacia stock_movements: su PK real es compuesta
-- (id, created_at) por el particionamiento, así que no hay una columna única simple contra la
-- cual apuntar una FK. Mismo criterio ya usado en stock_movements.source_entity_id (referencia
-- polimórfica deliberadamente sin FK).
--
-- ADR-INV-003 §2.3/§8.3 · ADR-INF-001 §6/§10 · ISSUE-07.

CREATE TABLE inventory.movement_idempotency_keys (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.tenants (id),
    idempotency_key TEXT NOT NULL,
    -- Nullable a propósito: se reserva la clave (INSERT) ANTES de conocer el id del movimiento
    -- real; se completa con un UPDATE dentro de la MISMA transacción una vez creado.
    movement_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_inventory_movement_idempotency_keys PRIMARY KEY (id)
);

CREATE UNIQUE INDEX uq_inventory_movement_idempotency_keys_tenant_key
  ON inventory.movement_idempotency_keys (tenant_id, idempotency_key);

COMMENT ON TABLE inventory.movement_idempotency_keys IS
  'ISSUE-07: reserva de claves de idempotencia para inventory.stock_movements. Tabla separada porque stock_movements está particionada por created_at y no admite un índice único (tenant_id, idempotency_key) directo. Ver 45_movement_idempotency_keys.sql para el razonamiento completo.';
