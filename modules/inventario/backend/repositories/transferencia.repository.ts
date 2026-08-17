import type {
  InventoryPrisma,
  stock_transfers,
  stock_transfer_lines,
} from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import type { EstadoTransferencia } from '../entities/transferencia.entity';

export interface CrearTransferenciaParams {
  companyId: string;
  branchId: string | null;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  documentNumber: string;
  lines: Array<{
    productId: string;
    quantity: number;
    lotId: string | null;
    serialNumbers: string[] | null;
  }>;
}

export type TransferenciaConLineas = stock_transfers & {
  stock_transfer_lines: stock_transfer_lines[];
};

/**
 * `inventory.stock_transfers` + `stock_transfer_lines` — encabezado y
 * líneas se crean juntos en una sola escritura (nested write de Prisma,
 * ya transaccional). El cambio de `status` es una operación aparte —
 * ver `TransferenciasService`, que orquesta el motor de movimientos
 * (`MovimientosService.registrarLote`) antes de confirmar el nuevo
 * estado.
 */
export abstract class TransferenciaRepository {
  abstract crear(
    context: UserContext,
    params: CrearTransferenciaParams,
  ): Promise<TransferenciaConLineas>;

  abstract obtener(context: UserContext, id: string): Promise<TransferenciaConLineas | null>;

  abstract listar(
    context: UserContext,
    filter: InventoryPrisma.stock_transfersWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<stock_transfers>>;

  abstract actualizarEstado(
    context: UserContext,
    id: string,
    status: EstadoTransferencia,
  ): Promise<stock_transfers>;
}
