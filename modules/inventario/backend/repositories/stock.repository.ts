import type { InventoryPrisma, stock } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

/**
 * Adaptador de solo lectura sobre `inventory.stock` — NO extiende
 * `BaseRepository` ni expone `create`/`update`: el saldo de stock nunca
 * se escribe directo, siempre como efecto atómico de un movimiento
 * (`MovimientoStockRepository.registrar`, `INVENTORY_ARCHITECTURE.md §6`)
 * — exponer una escritura acá abriría un segundo camino que podría
 * desincronizar `stock` de su propio kardex.
 */
export abstract class StockRepository {
  abstract obtener(
    context: UserContext,
    filtro: { productId: string; warehouseId: string; locationId: string | null },
  ): Promise<stock | null>;

  abstract listar(
    context: UserContext,
    filter: InventoryPrisma.stockWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<stock>>;
}
