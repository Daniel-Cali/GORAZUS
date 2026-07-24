/**
 * Entidad de dominio pura sobre `inventory.stock_reservations` — cantidad
 * reservada para un pedido de venta/orden de producción, polimórfico
 * (`INVENTORY_ARCHITECTURE.md §2`). A diferencia de `MovimientoStock`,
 * acá `sourceModule`/`sourceEntityId` son `NOT NULL` en el schema — una
 * reserva siempre tiene un dueño identificable, nunca es "suelta".
 */
export class ReservaStock {
  constructor(
    public readonly productId: string,
    public readonly warehouseId: string,
    public readonly quantity: number,
    public readonly sourceModule: string,
    public readonly sourceEntityId: string,
  ) {
    if (quantity <= 0) {
      throw new Error('La cantidad de una reserva debe ser mayor que cero');
    }
    if (sourceModule.trim().length === 0) {
      throw new Error('El módulo origen de la reserva es obligatorio');
    }
    if (sourceEntityId.trim().length === 0) {
      throw new Error('La entidad origen de la reserva es obligatoria');
    }
  }
}
