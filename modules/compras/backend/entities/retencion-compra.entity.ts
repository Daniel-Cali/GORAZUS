/**
 * Entidad de dominio pura sobre `purchases.purchase_withholdings` —
 * Compras FASE 10 (Purchase Withholdings). Sin líneas propias — es un
 * registro a nivel de cabecera de factura (retención de impuestos
 * aplicada al total, no por producto), sin flujo de estados en el
 * schema real (mismo criterio que `DevolucionCompra`/
 * `NotaCreditoCompra`).
 */
export class RetencionCompra {
  constructor(
    public readonly id: string,
    public readonly purchaseInvoiceId: string,
    public readonly withholdingRuleId: string | null,
    public readonly amount: number,
  ) {
    if (purchaseInvoiceId.trim().length === 0) {
      throw new Error('La retención requiere una factura de compra');
    }
    if (amount <= 0) {
      throw new Error('El monto de la retención debe ser mayor que cero');
    }
  }
}
