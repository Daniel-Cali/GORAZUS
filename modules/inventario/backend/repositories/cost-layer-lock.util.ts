import type { InventoryPrismaClient } from '@gorazus/core-database';

export interface CapaDeCostoRowLocked {
  id: string;
  original_quantity: unknown;
  remaining_quantity: unknown;
  unit_cost: unknown;
}

/** Lanzado por el adaptador (`Fifo`/`LifoCostLayerRepositoryPrisma.consumir`) si no hay capas suficientes con `remaining_quantity > 0` para cubrir la cantidad pedida — traducido a `CapaDeCostoInsuficienteException` en `CosteoService`, mismo patrón que `StockInsuficienteError` (`movimiento-stock.repository.ts`). */
export class CapaDeCostoInsuficienteError extends Error {
  constructor(
    public readonly disponible: number,
    public readonly solicitado: number,
  ) {
    super(`Capas de costo insuficientes: disponible ${disponible}, solicitado ${solicitado}`);
  }
}

/**
 * Bloquea (`SELECT ... FOR UPDATE`) las capas activas de `fifo_cost_layers`
 * para un producto/almacén, ordenadas de la más antigua a la más nueva
 * (`ADR-INV-004 §3.1`: PEPS consume primero la capa más antigua). Mismo
 * criterio de `lockStockRow` (`stock-lock.util.ts`): dos salidas
 * concurrentes sobre el mismo producto/almacén no pueden consumir la
 * misma capa dos veces — la segunda espera a que la primera confirme.
 */
export async function lockFifoLayerRows(
  tx: InventoryPrismaClient,
  params: { productId: string; warehouseId: string },
): Promise<CapaDeCostoRowLocked[]> {
  const txRaw = tx as unknown as {
    $queryRawUnsafe: (query: string, ...values: unknown[]) => Promise<CapaDeCostoRowLocked[]>;
  };
  return txRaw.$queryRawUnsafe(
    `SELECT id, original_quantity, remaining_quantity, unit_cost
     FROM inventory.fifo_cost_layers
     WHERE product_id = $1::uuid AND warehouse_id = $2::uuid
       AND remaining_quantity > 0 AND deleted_at IS NULL
     ORDER BY created_at ASC
     FOR UPDATE`,
    params.productId,
    params.warehouseId,
  );
}

/** Igual que `lockFifoLayerRows`, pero para `lifo_cost_layers` ordenadas de la más nueva a la más antigua (`ADR-INV-004 §3.2`: UEPS consume primero la capa más reciente). */
export async function lockLifoLayerRows(
  tx: InventoryPrismaClient,
  params: { productId: string; warehouseId: string },
): Promise<CapaDeCostoRowLocked[]> {
  const txRaw = tx as unknown as {
    $queryRawUnsafe: (query: string, ...values: unknown[]) => Promise<CapaDeCostoRowLocked[]>;
  };
  return txRaw.$queryRawUnsafe(
    `SELECT id, original_quantity, remaining_quantity, unit_cost
     FROM inventory.lifo_cost_layers
     WHERE product_id = $1::uuid AND warehouse_id = $2::uuid
       AND remaining_quantity > 0 AND deleted_at IS NULL
     ORDER BY created_at DESC
     FOR UPDATE`,
    params.productId,
    params.warehouseId,
  );
}
