export interface LineaSolicitudCompraInput {
  productId: string;
  quantity: number;
}

/**
 * Entidad de dominio pura sobre `purchases.purchase_requisitions`/
 * `purchase_requisition_lines` — Compras FASE 3 (Purchase Requisition).
 * A diferencia de `Cotizacion` (Ventas), una línea de requerimiento no
 * lleva precio — es una solicitud interna de compra sujeta a
 * aprobación, el precio recién aparece en la Orden de Compra.
 */
export class SolicitudCompra {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly branchId: string | null,
    public readonly lines: LineaSolicitudCompraInput[],
  ) {
    if (lines.length === 0) {
      throw new Error('La solicitud de compra debe tener al menos una línea');
    }
    for (const line of lines) {
      if (line.quantity <= 0) {
        throw new Error('La cantidad de cada línea debe ser mayor que cero');
      }
    }
  }
}
