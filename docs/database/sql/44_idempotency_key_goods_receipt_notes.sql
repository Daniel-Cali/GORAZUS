-- ISSUE-07 (parcial): idempotencia en Recepciones de Compra (purchases.goods_receipt_notes).
-- Un reintento de red que reenvía la misma solicitud de creación debe reutilizar el registro
-- ya creado, nunca duplicarlo. Índice único parcial — mismo patrón ya real en el schema
-- (uq_core_tenants_slug, uq_core_users_tenant_email, etc.): la condición WHERE permite que
-- filas históricas y clientes que no envíen la clave convivan sin violar la unicidad.
--
-- ADR-INV-003 §2.3 (brecha original) · ADR-INF-001 §6/§10 (formalización) · ISSUE-07.
--
-- No incluye inventory.stock_movements — esa tabla está particionada por created_at
-- (29_partitioning.sql) y un índice único (tenant_id, idempotency_key) sin la columna
-- de partición no es válido en Postgres tal cual. Ver informe de la sesión para las
-- opciones evaluadas; pendiente de decisión antes de migrar esa tabla.

ALTER TABLE purchases.goods_receipt_notes ADD COLUMN idempotency_key TEXT;

CREATE UNIQUE INDEX uq_purchases_goods_receipt_notes_idempotency_key
  ON purchases.goods_receipt_notes (tenant_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
