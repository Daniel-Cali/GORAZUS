export interface LineaFacturaInput {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPercentage?: number;
}

/**
 * Entidad de dominio pura sobre `sales.invoices`/`invoice_lines`
 * (`POS_ARCHITECTURE.md §3`) — la venta POS **es** una factura directa
 * (`sales_channel='pos'`), sin cotización/pedido/remito previos.
 */
export class Factura {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly branchId: string,
    public readonly customerId: string,
    public readonly lines: LineaFacturaInput[],
  ) {
    if (lines.length === 0) {
      throw new Error('La factura debe tener al menos una línea');
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
