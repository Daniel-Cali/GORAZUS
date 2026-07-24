import type { InventoryPrismaClient } from '@gorazus/core-database';

export interface StockRowLocked {
  id: string;
  quantity_on_hand: unknown;
  quantity_reserved: unknown;
}

/**
 * Bloquea (`SELECT ... FOR UPDATE`) la fila de `inventory.stock` para un
 * producto/almacén/ubicación, dentro de la transacción activa — Parte 04
 * (Ajustes y Conteos), pedido explícito de evaluar bloqueo de filas para
 * proteger operaciones críticas. Usado por `MovimientoStockRepositoryPrisma`
 * (movimientos/transferencias/ajustes, todo pasa por `registrar`/
 * `registrarLote`) y `ReservaStockRepositoryPrisma` — dos transacciones
 * concurrentes sobre el mismo saldo ya no pueden leer el mismo valor
 * antes de que cualquiera escriba: la segunda espera a que la primera
 * termine (commit o rollback) antes de que su propio `SELECT ... FOR
 * UPDATE` devuelva el control.
 *
 * `IS NOT DISTINCT FROM` (no `=`) para `location_id`: en SQL, `NULL =
 * NULL` es `NULL` (falso a efectos de `WHERE`), así que un `=` normal
 * nunca matchearía la fila "sin ubicación asignada" — exactamente la
 * que usan Reservas y la mayoría de movimientos sin `locationId`.
 *
 * Devuelve `null` si todavía no existe una fila de stock para esa
 * combinación — el llamador decide si eso significa "crear una nueva"
 * (movimientos/ajustes) o "no hay nada que reservar" (reservas).
 */
export async function lockStockRow(
  tx: InventoryPrismaClient,
  params: { productId: string; warehouseId: string; locationId: string | null },
): Promise<StockRowLocked | null> {
  const txRaw = tx as unknown as {
    $queryRawUnsafe: (query: string, ...values: unknown[]) => Promise<StockRowLocked[]>;
  };
  const rows = await txRaw.$queryRawUnsafe(
    `SELECT id, quantity_on_hand, quantity_reserved
     FROM inventory.stock
     WHERE product_id = $1 AND warehouse_id = $2
       AND location_id IS NOT DISTINCT FROM $3
       AND deleted_at IS NULL
     FOR UPDATE`,
    params.productId,
    params.warehouseId,
    params.locationId,
  );
  return rows[0] ?? null;
}

/** `true` si el error es una violación de unicidad de Prisma (P2002) — la carrera que `uq_inventory_stock` detecta cuando dos transacciones concurrentes insertan la misma fila nueva. */
export function esViolacionDeUnicidad(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  );
}
