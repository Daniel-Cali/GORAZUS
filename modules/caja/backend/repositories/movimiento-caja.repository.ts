import type { CashPrisma, cash_movements } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

export interface RegistrarMovimientoCajaParams {
  companyId: string;
  branchId: string | null;
  registerId: string;
  openingId: string;
  movementTypeId: string;
  amount: number;
  sourceModule: string | null;
  sourceEntityId: string | null;
  observations: string | null;
}

/**
 * `cash.cash_movements` — particionada mensualmente por `created_at`
 * (`docs/database/sql/09_cash.sql`), mismo motivo que
 * `MovimientoStockRepository` para no extender `BaseRepository`: el
 * cliente Prisma generado solo expone la clave única compuesta
 * `(id, created_at)`, nunca `id` a secas.
 */
export abstract class MovimientoCajaRepository {
  abstract registrar(
    context: UserContext,
    params: RegistrarMovimientoCajaParams,
  ): Promise<cash_movements>;

  abstract listar(
    context: UserContext,
    filter: CashPrisma.cash_movementsWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<cash_movements>>;
}
