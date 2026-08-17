export interface LineaRecepcionCompraInput {
  productId: string;
  quantity: number;
}

/**
 * Entidad de dominio pura sobre `purchases.goods_receipt_notes`/
 * `goods_receipt_note_lines` — Compras FASE 5 (Goods Receipt). A
 * diferencia de `SolicitudCompra`/`OrdenCompra`, esta entidad no tiene
 * flujo de estados propio (el schema real no lo define para este par de
 * tablas) — es el registro de lo que físicamente llegó contra una orden,
 * un hecho consumado al crearse, no un documento en construcción.
 */
export class RecepcionCompra {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly purchaseOrderId: string,
    public readonly lines: LineaRecepcionCompraInput[],
  ) {
    if (lines.length === 0) {
      throw new Error('La recepción debe tener al menos una línea');
    }
    for (const line of lines) {
      if (line.quantity <= 0) {
        throw new Error('La cantidad recibida de cada línea debe ser mayor que cero');
      }
    }
  }
}
