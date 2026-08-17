/**
 * Entidad de dominio pura sobre `inventory.putaway_rules` — WMS Basic
 * (Prompt 1, Foundation Completion). Una regla dice "en este almacén, la
 * categoría de producto X va a la zona Y", con prioridad para desempatar
 * cuando varias reglas matchean (mayor prioridad gana). `productCategoryId`
 * ausente = regla genérica del almacén (fallback).
 */
export class PutawayRule {
  constructor(
    public readonly warehouseId: string,
    public readonly targetZoneId: string,
    public readonly priority: number,
    public readonly productCategoryId?: string | null,
  ) {
    if (priority < 0) {
      throw new Error('La prioridad no puede ser negativa');
    }
  }
}
