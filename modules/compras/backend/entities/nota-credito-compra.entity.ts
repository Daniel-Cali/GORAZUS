export interface LineaNotaCreditoCompraInput {
  productId: string;
  quantity: number;
}

/**
 * Entidad de dominio pura sobre `purchases.purchase_credit_notes`/
 * `purchase_credit_note_lines` — Compras FASE 9 (Purchase Credit
 * Notes). Mismo criterio que `DevolucionCompra`: sin flujo de estados
 * propio en el schema real. A diferencia de `DevolucionCompra`, la
 * cabecera exige `totalAmount` — las líneas no llevan precio propio, se
 * deriva del costo unitario de la factura (calculado en el servicio,
 * nunca aquí).
 */
export class NotaCreditoCompra {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly purchaseInvoiceId: string,
    public readonly totalAmount: number,
    public readonly lines: LineaNotaCreditoCompraInput[],
  ) {
    if (lines.length === 0) {
      throw new Error('La nota de crédito debe tener al menos una línea');
    }
    for (const line of lines) {
      if (line.quantity <= 0) {
        throw new Error('La cantidad de cada línea debe ser mayor que cero');
      }
    }
    if (totalAmount < 0) {
      throw new Error('El monto total de la nota de crédito no puede ser negativo');
    }
  }
}
