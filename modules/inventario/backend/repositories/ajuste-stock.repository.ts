import type {
  InventoryPrisma,
  stock_adjustments,
  stock_adjustment_lines,
} from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

export interface CrearAjusteParams {
  companyId: string;
  branchId: string | null;
  warehouseId: string;
  reasonId: string;
  lines: Array<{
    productId: string;
    previousQuantity: number;
    newQuantity: number;
    lotId: string | null;
    serialNumbers: string[] | null;
  }>;
}

export type AjusteConLineas = stock_adjustments & {
  stock_adjustment_lines: stock_adjustment_lines[];
};

/**
 * `inventory.stock_adjustments` + `stock_adjustment_lines` — encabezado
 * y líneas se crean juntos (nested write de Prisma, ya transaccional).
 * El cambio de `status` (`draft → confirmed`) es una operación aparte —
 * ver `AjustesService`, que orquesta el motor de movimientos
 * (`MovimientosService.registrarLote`) antes de confirmar, mismo patrón
 * que `TransferenciaRepository` (Parte 03).
 */
export abstract class AjusteStockRepository {
  abstract crear(context: UserContext, params: CrearAjusteParams): Promise<AjusteConLineas>;

  abstract obtener(context: UserContext, id: string): Promise<AjusteConLineas | null>;

  abstract listar(
    context: UserContext,
    filter: InventoryPrisma.stock_adjustmentsWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<stock_adjustments>>;

  abstract confirmar(context: UserContext, id: string): Promise<stock_adjustments>;
}
