/**
 * Entidad de dominio pura sobre `inventory.replenishment_rules` — WMS
 * Basic (Prompt 1, Foundation Completion). Un rango min/max por producto y
 * almacén — cuando `quantity_on_hand < minQuantity`, hace falta reponer
 * hasta `maxQuantity` (ver `ReplenishmentRulesService.evaluar`).
 */
export class ReplenishmentRule {
  constructor(
    public readonly warehouseId: string,
    public readonly productId: string,
    public readonly minQuantity: number,
    public readonly maxQuantity: number,
  ) {
    if (minQuantity < 0) {
      throw new Error('La cantidad mínima no puede ser negativa');
    }
    if (maxQuantity <= minQuantity) {
      throw new Error('La cantidad máxima debe ser mayor que la cantidad mínima');
    }
  }
}
