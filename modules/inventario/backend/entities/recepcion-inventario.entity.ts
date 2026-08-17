/**
 * Entidad de dominio pura sobre `inventory.goods_receipts`/`goods_receipt_lines`
 * — recepción física de inventario (Inventario Parte 05, Subfase 1: Recepciones).
 * El schema real no define una columna de estado (mismo patrón ya aceptado en
 * `purchases.goods_receipt_notes`, ver `Issue Register` ISSUE-25) — el estado
 * (`borrador`/`confirmada`/`cancelada`) se deriva en el servicio a partir de si
 * ya existen `stock_movements` para esta recepción, nunca se persiste aquí.
 */
export class RecepcionInventario {
  constructor(
    public readonly warehouseId: string,
    public readonly lines: Array<{ productId: string; quantity: number; unitCost: number | null }>,
    public readonly sourceModule: string | null,
    public readonly sourceEntityId: string | null,
  ) {
    if (lines.length === 0) {
      throw new Error('La recepción debe tener al menos una línea');
    }
    for (const linea of lines) {
      if (linea.quantity <= 0) {
        throw new Error('La cantidad de cada línea debe ser mayor que cero');
      }
      if (linea.unitCost !== null && linea.unitCost < 0) {
        throw new Error('El costo unitario no puede ser negativo');
      }
    }
    const tieneModulo = sourceModule !== null && sourceModule.trim().length > 0;
    const tieneEntidad = sourceEntityId !== null && sourceEntityId.trim().length > 0;
    if (tieneModulo !== tieneEntidad) {
      throw new Error(
        'El documento origen debe indicar módulo y entidad juntos, o ninguno de los dos',
      );
    }
  }
}
