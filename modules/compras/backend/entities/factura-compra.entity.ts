export interface LineaFacturaCompraInput {
  productId: string;
  quantity: number;
  unitCost: number;
  taxId?: string | null;
}

/**
 * Entidad de dominio pura sobre `purchases.purchase_invoices`/
 * `purchase_invoice_lines` — Compras FASE 6 (Purchase Invoice). Ingresa
 * como cuenta por pagar (CxP); sin cálculo de impuesto real (motor de
 * impuestos fuera de alcance de esta fase) — `taxId` queda como
 * referencia opcional sin validar contra `taxes.taxes`.
 */
export class FacturaCompra {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly supplierId: string,
    public readonly supplierDocumentNumber: string,
    public readonly lines: LineaFacturaCompraInput[],
  ) {
    if (supplierDocumentNumber.trim().length === 0) {
      throw new Error('El número de documento del proveedor no puede estar vacío');
    }
    if (lines.length === 0) {
      throw new Error('La factura de compra debe tener al menos una línea');
    }
    for (const line of lines) {
      if (line.quantity <= 0) {
        throw new Error('La cantidad de cada línea debe ser mayor que cero');
      }
      if (line.unitCost < 0) {
        throw new Error('El costo unitario de cada línea no puede ser negativo');
      }
    }
  }
}
