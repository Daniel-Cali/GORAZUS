/**
 * Entidad de dominio pura sobre `inventory.stock_movements` — la fuente
 * de verdad única del kardex (`INVENTORY_ARCHITECTURE.md §6`), nunca se
 * actualiza ni se elimina una vez creada (append-only, particionada por
 * `created_at`). `sourceModule`/`sourceEntityId` son el par polimórfico
 * de "documento origen" — o los dos están presentes, o ninguno: un
 * origen a medias no es trazable.
 */
export class MovimientoStock {
  constructor(
    public readonly productId: string,
    public readonly warehouseId: string,
    public readonly movementTypeId: string,
    public readonly quantity: number,
    public readonly unitCost: number | null,
    public readonly sourceModule: string | null,
    public readonly sourceEntityId: string | null,
  ) {
    if (quantity <= 0) {
      throw new Error('La cantidad de un movimiento debe ser mayor que cero');
    }
    if (unitCost !== null && unitCost < 0) {
      throw new Error('El costo unitario no puede ser negativo');
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
