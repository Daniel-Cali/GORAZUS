import type { InventoryPrisma, stock, stock_movements } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import type { DireccionMovimiento } from '../entities/tipo-movimiento-stock.entity';

export interface RegistrarMovimientoParams {
  /** Resueltos desde el almacén destino (`warehouses.company_id`/`branch_id`, ambos `NOT NULL`) — no se piden redundantes al llamador, ver `MovimientosService`. */
  companyId: string;
  branchId: string | null;
  productId: string;
  warehouseId: string;
  locationId: string | null;
  movementTypeId: string;
  direction: DireccionMovimiento;
  quantity: number;
  unitCost: number | null;
  sourceModule: string | null;
  sourceEntityId: string | null;
  observations: string | null;
}

/** Lanzado por el adaptador si una salida ('out') dejaría `quantity_on_hand` negativo — traducido a excepción de dominio en `MovimientosService`. */
export class StockInsuficienteError extends Error {
  constructor(
    public readonly disponible: number,
    public readonly solicitado: number,
  ) {
    super(`Stock insuficiente: disponible ${disponible}, solicitado ${solicitado}`);
  }
}

/**
 * `inventory.stock_movements` (particionada por `created_at`, NO extiende
 * `BaseRepository` — mismo motivo que `AuditoriaRepository`: el cliente
 * Prisma generado solo ofrece una clave única compuesta `(id, created_at)`,
 * nunca `id` a secas) + el efecto atómico sobre `inventory.stock`
 * (`INVENTORY_ARCHITECTURE.md §6` — `stock` nunca se actualiza fuera de
 * este método, ver `StockRepository`). `registrar` hace ambas escrituras
 * dentro de la misma transacción de `withTenantScope` — un movimiento sin
 * su saldo actualizado (o viceversa) no es un estado válido.
 */
export abstract class MovimientoStockRepository {
  abstract registrar(
    context: UserContext,
    params: RegistrarMovimientoParams,
  ): Promise<{ movimiento: stock_movements; stockActualizado: stock }>;

  abstract listar(
    context: UserContext,
    filter: InventoryPrisma.stock_movementsWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<stock_movements>>;
}
