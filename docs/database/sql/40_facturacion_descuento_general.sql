-- =============================================================================
-- GORAZUS ERP — 40_facturacion_descuento_general.sql
-- Motor de Facturación Enterprise, Parte 1 — agrega el descuento general
-- (a nivel de factura, distinto del descuento por línea que ya existía)
-- pedido explícitamente. Decisión de cálculo (documentada por no haber
-- especificación de negocio previa): el descuento general se aplica
-- sobre `subtotal_amount` (ya neto de descuentos por línea) y NO
-- recalcula `tax_amount` — el impuesto ya se calculó por línea sobre el
-- precio con descuento de línea únicamente, criterio más simple y
-- predecible que prorratear el impuesto; revisar si en el futuro se
-- requiere cumplimiento fiscal que exija lo contrario.
-- Archivo nuevo — no edita ningún archivo ya existente, mantiene el
-- historial de migración append-only.
-- Depende de: 01_core.sql .. 39_roles_enterprise_fields.sql
-- =============================================================================

ALTER TABLE sales.invoices
    ADD COLUMN general_discount_percentage NUMERIC(5,2) NOT NULL DEFAULT 0
        CONSTRAINT invoices_general_discount_percentage_check
        CHECK (general_discount_percentage >= 0 AND general_discount_percentage <= 100);

COMMENT ON COLUMN sales.invoices.general_discount_percentage IS 'Descuento general de la factura (0-100), distinto del descuento por línea de `invoice_lines.discount_percentage` — se aplica sobre `subtotal_amount` ya neto de descuentos de línea, no recalcula `tax_amount`. "Motor de Facturación Enterprise", Parte 1.';

-- -----------------------------------------------------------------------------
-- Verificación — debe devolver 0 filas en cada chequeo.
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    v_fuera_de_rango int;
BEGIN
    SELECT count(*) INTO v_fuera_de_rango
    FROM sales.invoices
    WHERE general_discount_percentage < 0 OR general_discount_percentage > 100;
    IF v_fuera_de_rango <> 0 THEN
        RAISE EXCEPTION '40_facturacion_descuento_general: % facturas con descuento general fuera de rango', v_fuera_de_rango;
    END IF;

    RAISE NOTICE '40_facturacion_descuento_general: OK';
END $$;
