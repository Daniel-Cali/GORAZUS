export interface LineaDevolucionCompraInput {
  productId: string;
  quantity: number;
}

/**
 * Entidad de dominio pura sobre `purchases.purchase_returns`/
 * `purchase_return_lines` — Compras FASE 8 (Purchase Returns). Mismo
 * criterio que `RecepcionCompra` (Goods Receipt): sin flujo de estados
 * propio en el schema real — es el registro de lo devuelto contra una
 * factura ya registrada, un hecho consumado al crearse.
 */
export class DevolucionCompra {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly purchaseInvoiceId: string,
    public readonly lines: LineaDevolucionCompraInput[],
  ) {
    if (lines.length === 0) {
      throw new Error('La devolución debe tener al menos una línea');
    }
    for (const line of lines) {
      if (line.quantity <= 0) {
        throw new Error('La cantidad devuelta de cada línea debe ser mayor que cero');
      }
    }
  }
}
