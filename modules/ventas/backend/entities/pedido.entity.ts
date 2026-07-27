export interface LineaPedidoInput {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPercentage?: number;
}

/**
 * Entidad de dominio pura sobre `sales.sales_orders`/`sales_order_lines`
 * — Módulo de Ventas Enterprise, Parte 1 (Cotización → Pedido → Factura).
 */
export class Pedido {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly branchId: string,
    public readonly customerId: string,
    public readonly lines: LineaPedidoInput[],
  ) {
    if (lines.length === 0) {
      throw new Error('El pedido debe tener al menos una línea');
    }
    for (const line of lines) {
      if (line.quantity <= 0) {
        throw new Error('La cantidad de cada línea debe ser mayor que cero');
      }
      if (line.unitPrice < 0) {
        throw new Error('El precio unitario de cada línea no puede ser negativo');
      }
      const descuento = line.discountPercentage ?? 0;
      if (descuento < 0 || descuento > 100) {
        throw new Error('El descuento de cada línea debe estar entre 0 y 100');
      }
    }
  }
}
