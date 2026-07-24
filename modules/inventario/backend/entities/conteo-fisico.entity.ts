export interface LineaConteoInput {
  productId: string;
  systemQuantity: number;
}

/**
 * Entidad de dominio pura sobre `inventory.physical_counts` +
 * `physical_count_lines` — campaña de toma física
 * (`INVENTORY_PHYSICAL_COUNTS.md §2`). `systemQuantity` se resuelve del
 * stock real al momento de crear el conteo (`ConteosService`, no acá).
 * Sin líneas no hay nada que contar.
 */
export class ConteoFisico {
  constructor(
    public readonly id: string,
    public readonly warehouseId: string,
    public readonly scheduledDate: Date,
    public readonly lines: LineaConteoInput[],
  ) {
    if (lines.length === 0) {
      throw new Error('Un conteo físico necesita al menos una línea');
    }
    for (const linea of lines) {
      if (linea.systemQuantity < 0) {
        throw new Error('La cantidad en sistema de cada línea no puede ser negativa');
      }
    }
  }
}
