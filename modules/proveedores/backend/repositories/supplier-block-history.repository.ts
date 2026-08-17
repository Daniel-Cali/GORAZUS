import type { supplier_block_history } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

export interface RegistrarAccionBloqueoParams {
  supplierId: string;
  companyId: string;
  branchId: string | null;
  action: 'blocked' | 'unblocked';
  reason: string | null;
}

/**
 * `suppliers.supplier_block_history` — ledger append-only (mismo patrón
 * que `AverageCostHistoryRepository` de `inventario`): cada bloqueo o
 * desbloqueo agrega una fila nueva, nunca se actualiza una existente.
 */
export abstract class SupplierBlockHistoryRepository {
  abstract registrar(
    context: UserContext,
    params: RegistrarAccionBloqueoParams,
  ): Promise<supplier_block_history>;
}
