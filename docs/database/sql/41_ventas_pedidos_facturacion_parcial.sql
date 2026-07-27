-- =============================================================================
-- GORAZUS ERP — 41_ventas_pedidos_facturacion_parcial.sql
-- Módulo de Ventas Enterprise, Parte 1 — Cotización → Pedido → Factura.
-- Agrega `invoiced_quantity` a `sales_order_lines`: sin esta columna no hay
-- forma de saber cuánto de un pedido ya se facturó, requisito explícito del
-- pedido ("Pedidos de venta: Pendiente/Parcial/Completado") — sin ella el
-- estado "parcial" no puede derivarse de datos reales, solo simularse.
-- Archivo nuevo — no edita ningún archivo ya existente, mantiene el
-- historial de migración append-only.
-- Depende de: 01_core.sql .. 40_facturacion_descuento_general.sql
-- =============================================================================

ALTER TABLE sales.sales_order_lines
    ADD COLUMN invoiced_quantity NUMERIC(18,6) NOT NULL DEFAULT 0
        CONSTRAINT sales_order_lines_invoiced_quantity_check
        CHECK (invoiced_quantity >= 0 AND invoiced_quantity <= quantity);

COMMENT ON COLUMN sales.sales_order_lines.invoiced_quantity IS 'Cantidad ya convertida a línea(s) de factura — permite derivar pendiente/parcial/completado real por línea y por pedido, sin duplicar el dato en otra tabla. "Módulo de Ventas Enterprise", Parte 1 (Cotización → Pedido → Factura).';

-- -----------------------------------------------------------------------------
-- Verificación — debe devolver 0 filas en cada chequeo.
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    v_fuera_de_rango int;
BEGIN
    SELECT count(*) INTO v_fuera_de_rango
    FROM sales.sales_order_lines
    WHERE invoiced_quantity < 0 OR invoiced_quantity > quantity;
    IF v_fuera_de_rango <> 0 THEN
        RAISE EXCEPTION '41_ventas_pedidos_facturacion_parcial: % líneas de pedido con invoiced_quantity fuera de rango', v_fuera_de_rango;
    END IF;

    RAISE NOTICE '41_ventas_pedidos_facturacion_parcial: OK';
END $$;
