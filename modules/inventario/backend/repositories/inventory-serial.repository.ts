import type { InventoryPrisma, inventory_serials } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

export interface CrearSerieParams {
  productId: string;
  warehouseId: string | null;
  serialNumber: string;
  unitCost: number | null;
}

export interface EmitirSerieParams {
  serialId: string;
  productId: string;
}

/** Lanzado por el adaptador si la serie no existe, no pertenece al producto indicado, ya fue emitida, o ya existe (duplicada) — traducido a excepción de dominio en el servicio. */
export class SerieInvalidaError extends Error {
  constructor(
    public readonly motivo:
      'no_existe' | 'producto_no_coincide' | 'ya_emitida' | 'duplicada' | 'no_emitida',
  ) {
    super(`Serie inválida: ${motivo}`);
  }
}

export const ESTADO_EN_STOCK = 'in_stock';
export const ESTADO_EMITIDA = 'issued';

/**
 * `inventory.inventory_serials` — Inventario Parte 05, Subfase 3. Una serie
 * representa UNA unidad física (`quantity` siempre 1 en cualquier
 * movimiento que la referencie) — nunca se agrupa como un lote. Identidad
 * única real `(tenant_id, serial_number)` — `46_stock_movements_lot_serial_traceability.sql`.
 */
export abstract class InventorySerialRepository {
  /** Lanza `SerieInvalidaError('duplicada')` si `(tenant_id, serial_number)` ya existe (`uq_inventory_inventory_serials_identity`). */
  abstract crear(context: UserContext, params: CrearSerieParams): Promise<inventory_serials>;

  /** Transición atómica `in_stock -> issued`. Lanza `SerieInvalidaError('ya_emitida')` si ya no estaba `in_stock`. */
  abstract emitir(context: UserContext, params: EmitirSerieParams): Promise<inventory_serials>;

  /** Reasigna `warehouse_id` — usado por `TransferenciasService.recibir()`. Una serie es siempre una unidad completa, sin ambigüedad de partición (a diferencia de `InventoryLotRepository.moverAlmacen`). */
  abstract moverAlmacen(
    context: UserContext,
    params: { serialId: string; warehouseId: string },
  ): Promise<inventory_serials>;

  /** Transición atómica inversa a `emitir`: `issued -> in_stock`. Usado por ajustes positivos (corrección: la serie "vuelve" a stock). Lanza `SerieInvalidaError('no_emitida')` si no estaba `issued`. */
  abstract devolverStock(
    context: UserContext,
    params: EmitirSerieParams,
  ): Promise<inventory_serials>;

  abstract obtenerPorId(context: UserContext, id: string): Promise<inventory_serials | null>;

  abstract obtenerPorNumero(
    context: UserContext,
    serialNumber: string,
  ): Promise<inventory_serials | null>;

  abstract listar(
    context: UserContext,
    filter: InventoryPrisma.inventory_serialsWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<inventory_serials>>;
}
