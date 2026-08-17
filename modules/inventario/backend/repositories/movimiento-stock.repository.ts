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
  /** ISSUE-07: si se provee, `registrar`/`registrarLote` son idempotentes por `(tenant_id, idempotencyKey)` vía `inventory.movement_idempotency_keys` — ver `MovimientoStockRepositoryPrisma`. */
  idempotencyKey: string | null;
  /** Inventario Parte 05 Subfase 3: lote/serie de origen o destino — resueltos y validados por el llamador (Recepciones/Salidas), este repositorio solo persiste la referencia (`46_stock_movements_lot_serial_traceability.sql`). */
  lotId: string | null;
  serialId: string | null;
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

  /** ISSUE-07: lookup de solo lectura por clave de idempotencia — usado por el servicio para saltar `resolverYValidar` si ya existe un movimiento completado para esa clave. */
  abstract obtenerPorIdempotencyKey(
    context: UserContext,
    idempotencyKey: string,
  ): Promise<stock_movements | null>;

  /**
   * Igual que `registrar`, pero para varios movimientos en la MISMA
   * transacción — Parte 03 (Transferencias): una transferencia con varias
   * líneas se aplica completa o nada, nunca a medio camino.
   */
  abstract registrarLote(
    context: UserContext,
    items: RegistrarMovimientoParams[],
  ): Promise<Array<{ movimiento: stock_movements; stockActualizado: stock }>>;

  abstract listar(
    context: UserContext,
    filter: InventoryPrisma.stock_movementsWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<stock_movements>>;
}
