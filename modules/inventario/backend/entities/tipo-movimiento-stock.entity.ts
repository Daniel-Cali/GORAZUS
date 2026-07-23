const DIRECCIONES = ['in', 'out'] as const;
export type DireccionMovimiento = (typeof DIRECCIONES)[number];

/**
 * Entidad de dominio pura sobre `inventory.stock_movement_types` — un
 * catálogo, no un enum embebido (`INVENTORY_ARCHITECTURE.md §6`): agregar
 * un tipo de movimiento nuevo es una fila, no una migración. `code` es
 * único por tenant vía índice parcial (`uq_inventory_movement_types_code`,
 * `docs/database/sql/06_inventory.sql`) — la unicidad real se valida en
 * `TiposMovimientoService`, esta entidad solo valida su propia forma.
 */
export class TipoMovimientoStock {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly direction: DireccionMovimiento,
  ) {
    if (code.trim().length === 0) {
      throw new Error('El código del tipo de movimiento no puede estar vacío');
    }
    if (!DIRECCIONES.includes(direction)) {
      throw new Error(`Dirección de movimiento inválida: "${direction}"`);
    }
  }
}
