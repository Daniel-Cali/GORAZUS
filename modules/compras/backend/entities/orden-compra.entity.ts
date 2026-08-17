export interface LineaOrdenCompraInput {
  productId: string;
  quantity: number;
  unitPrice: number;
}

/**
 * Entidad de dominio pura sobre `purchases.purchase_orders`/
 * `purchase_order_lines` — Compras FASE 4 (Purchase Order). A
 * diferencia de `SolicitudCompra`, sí lleva precio por línea (ya es una
 * orden confirmada hacia un proveedor, no un requerimiento interno).
 */
export class OrdenCompra {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly branchId: string,
    public readonly supplierId: string,
    public readonly lines: LineaOrdenCompraInput[],
  ) {
    if (lines.length === 0) {
      throw new Error('La orden de compra debe tener al menos una línea');
    }
    for (const line of lines) {
      if (line.quantity <= 0) {
        throw new Error('La cantidad de cada línea debe ser mayor que cero');
      }
      if (line.unitPrice < 0) {
        throw new Error('El precio unitario de cada línea no puede ser negativo');
      }
    }
  }
}
