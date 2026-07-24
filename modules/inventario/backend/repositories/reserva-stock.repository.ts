import type { InventoryPrisma, stock_reservations } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

export interface CrearReservaParams {
  /** Resuelto desde el almacén, igual que `RegistrarMovimientoParams` — ver `ReservasService`. */
  companyId: string;
  branchId: string | null;
  productId: string;
  warehouseId: string;
  quantity: number;
  sourceModule: string;
  sourceEntityId: string;
  observations: string | null;
}

/** Lanzado si la reserva excede lo disponible (`quantity_on_hand - quantity_reserved`) — traducido a excepción de dominio en `ReservasService`. */
export class CapacidadReservaInsuficienteError extends Error {
  constructor(
    public readonly disponible: number,
    public readonly solicitado: number,
  ) {
    super(`Capacidad de reserva insuficiente: disponible ${disponible}, solicitado ${solicitado}`);
  }
}

export class ReservaYaLiberadaError extends Error {
  constructor(id: string) {
    super(`La reserva "${id}" ya fue liberada`);
  }
}

export class ReservaNoEncontradaError extends Error {
  constructor(id: string) {
    super(`No existe la reserva "${id}"`);
  }
}

/**
 * `inventory.stock_reservations` + el efecto atómico sobre
 * `inventory.stock.quantity_reserved` — nunca se toca fuera de acá,
 * mismo criterio que `MovimientoStockRepository` sobre `quantity_on_hand`.
 * **Alcance de esta parte**: opera exclusivamente sobre el registro de
 * stock sin ubicación asignada (`location_id IS NULL`) — el schema de
 * `stock_reservations` no tiene `location_id` (no permite reservar una
 * ubicación específica dentro de un almacén), así que no tiene sentido
 * agregarlo a través de varias ubicaciones tampoco; si el stock real
 * está repartido en ubicaciones, hay que consolidarlo a `location_id
 * NULL` primero (fuera de alcance — ver `INVENTORY_RESERVAS_REPORT.md`).
 */
export abstract class ReservaStockRepository {
  abstract crear(context: UserContext, params: CrearReservaParams): Promise<stock_reservations>;

  /** Idempotente en el sentido de que rechaza liberar una reserva ya liberada (`ReservaYaLiberadaError`). */
  abstract liberar(context: UserContext, id: string): Promise<stock_reservations>;

  abstract obtener(context: UserContext, id: string): Promise<stock_reservations | null>;

  abstract listar(
    context: UserContext,
    filter: InventoryPrisma.stock_reservationsWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<stock_reservations>>;
}
