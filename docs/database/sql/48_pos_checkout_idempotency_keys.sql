-- P0-1 (auditoría POS): idempotencia real en POST /pos/ventas.
--
-- Mismo motivo que ISSUE-07/Inventario (45_movement_idempotency_keys.sql):
-- sales.invoices está particionada por issued_at (07_sales.sql) — Postgres
-- exige que todo índice único sobre una tabla particionada incluya la
-- columna de partición, así que un índice único (tenant_id, idempotency_key)
-- directo sobre invoices no es válido. Se usa una tabla ledger separada, NO
-- particionada, siguiendo exactamente el mismo patrón.
--
-- Diferencia real con el caso de Inventario: `registrarLote` es UNA sola
-- transacción Prisma (reserva + movimiento se confirman juntos o no se
-- confirma ninguno). El checkout de POS NO es una única transacción —
-- atraviesa sales/inventory/cash de forma secuencial (documentado en
-- `PosCheckoutService`, no atómico entre schemas). Por eso esta tabla
-- necesita un `status` explícito (`processing`/`succeeded`/`failed`): un
-- lector concurrente SÍ puede observar la clave en `processing` real, algo
-- que nunca pasa en el caso de Inventario porque ahí la reserva y el
-- llenado ocurren dentro de la misma transacción atómica.
--
-- `result` guarda la respuesta exacta del checkout exitoso (factura +
-- cambio) para que un replay devuelva el mismo cuerpo sin recalcular nada.
-- `error_code`/`error_message` guardan el fallo si `status = 'failed'`,
-- para que un replay de una clave que genuinamente falló reciba el mismo
-- error — no un reintento silencioso con resultado distinto.

CREATE TABLE sales.pos_checkout_idempotency_keys (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.tenants (id),
    idempotency_key TEXT NOT NULL,
    payload_fingerprint TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing',
    -- Nullable a propósito: se conoce recién cuando `crearFactura` corre,
    -- más adelante en la orquestación (mismo motivo que `movement_id` en
    -- 45_movement_idempotency_keys.sql). Sin FK real — invoices tiene PK
    -- compuesta (id, issued_at) por el particionamiento, mismo criterio ya
    -- usado en source_entity_id/movement_id (referencia sin FK).
    invoice_id UUID,
    result JSONB,
    error_code TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_sales_pos_checkout_idempotency_keys PRIMARY KEY (id),
    CONSTRAINT chk_sales_pos_checkout_idempotency_keys_status
        CHECK (status IN ('processing', 'succeeded', 'failed'))
);

-- La reserva atómica real: dos INSERT concurrentes con la misma
-- (tenant_id, idempotency_key) — Postgres serializa la carrera vía este
-- índice, el segundo falla con unique_violation (P2002 en Prisma) y el
-- código de aplicación recupera la fila ya reservada por el primero.
CREATE UNIQUE INDEX uq_sales_pos_checkout_idempotency_keys_tenant_key
  ON sales.pos_checkout_idempotency_keys (tenant_id, idempotency_key);

COMMENT ON TABLE sales.pos_checkout_idempotency_keys IS
  'P0-1: ledger de idempotencia para POST /pos/ventas. No representa una venta, un carrito ni duplica sales.invoices — su única responsabilidad es recordar si un checkout con una idempotencyKey dada ya fue procesado. Ver 48_pos_checkout_idempotency_keys.sql para el razonamiento completo.';
