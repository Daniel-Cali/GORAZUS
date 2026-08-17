/**
 * Entidad de dominio pura sobre `purchases.purchase_invoice_matching` —
 * Compras FASE 7 (Purchase Matching, 3-way match OC↔Recepción↔Factura).
 * A diferencia del resto de los aggregates de Compras, no representa un
 * documento en construcción — es el **resultado calculado** de cotejar
 * tres documentos ya existentes, sin flujo de estados propio.
 */
export class CotejoCompra {
  constructor(
    public readonly id: string,
    public readonly purchaseOrderId: string,
    public readonly receiptNoteId: string,
    public readonly purchaseInvoiceId: string,
    public readonly discrepancyAmount: number,
    public readonly isWithinTolerance: boolean,
  ) {
    if (purchaseOrderId.trim().length === 0) {
      throw new Error('El cotejo requiere una orden de compra');
    }
    if (receiptNoteId.trim().length === 0) {
      throw new Error('El cotejo requiere una recepción de compra');
    }
    if (purchaseInvoiceId.trim().length === 0) {
      throw new Error('El cotejo requiere una factura de compra');
    }
    if (discrepancyAmount < 0) {
      throw new Error('El monto de discrepancia no puede ser negativo');
    }
  }
}
