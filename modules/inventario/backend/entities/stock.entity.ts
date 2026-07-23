/**
 * Entidad de dominio pura sobre `inventory.stock` — saldo actual de un
 * producto en un almacén/ubicación (`INVENTORY_ARCHITECTURE.md §2`).
 * Invariante que la tabla NO fuerza por `CHECK` (columnas `NUMERIC`
 * independientes, sin restricción cruzada): lo reservado nunca puede
 * superar lo disponible físicamente. Se valida acá, no en la base —
 * mismo criterio que el invariante marca↔modelo de `Producto`
 * (`modules/productos/backend`).
 */
export class Stock {
  constructor(
    public readonly productId: string,
    public readonly warehouseId: string,
    public readonly locationId: string | null,
    public readonly quantityOnHand: number,
    public readonly quantityReserved: number,
  ) {
    if (quantityOnHand < 0) {
      throw new Error('La cantidad en existencia no puede ser negativa');
    }
    if (quantityReserved < 0) {
      throw new Error('La cantidad reservada no puede ser negativa');
    }
    if (quantityReserved > quantityOnHand) {
      throw new Error('La cantidad reservada no puede superar la cantidad en existencia');
    }
  }

  /** `inventory.v_available_stock.quantity_available` — disponible = a mano - reservado. */
  get quantityAvailable(): number {
    return this.quantityOnHand - this.quantityReserved;
  }
}
