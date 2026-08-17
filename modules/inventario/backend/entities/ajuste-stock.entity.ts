export interface LineaAjusteInput {
  productId: string;
  previousQuantity: number;
  newQuantity: number;
  /** Prompt 1 (Foundation Completion): lote/serie EXISTENTE afectado por el ajuste — opcional. `null` cuando `AjustesService` ya resolvió que no aplica (producto sin tracks_lot/tracks_serial). */
  lotId?: string | null;
  serialNumbers?: string[] | null;
}

/**
 * Entidad de dominio pura sobre `inventory.stock_adjustments` +
 * `stock_adjustment_lines` — encabezado de ajuste de inventario
 * (`INVENTORY_ADJUSTMENTS_REPORT.md §2`). `previousQuantity` se resuelve
 * del stock real al momento de crear el ajuste (`AjustesService`, no acá
 * — una entidad de dominio pura no consulta la base), esta entidad solo
 * valida la forma: cada línea necesita una cantidad nueva no negativa, y
 * un ajuste sin líneas no tiene sentido.
 */
export class AjusteStock {
  constructor(
    public readonly id: string,
    public readonly warehouseId: string,
    public readonly reasonId: string,
    public readonly lines: LineaAjusteInput[],
  ) {
    if (lines.length === 0) {
      throw new Error('Un ajuste necesita al menos una línea');
    }
    for (const linea of lines) {
      if (linea.newQuantity < 0) {
        throw new Error('La nueva cantidad de cada línea no puede ser negativa');
      }
      if (linea.previousQuantity < 0) {
        throw new Error('La cantidad anterior de cada línea no puede ser negativa');
      }
    }
  }
}
