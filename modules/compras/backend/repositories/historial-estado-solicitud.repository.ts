import type { purchase_requisition_status_history } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

export interface RegistrarTransicionParams {
  requisitionId: string;
  companyId: string;
  branchId: string | null;
  statusId: string;
}

/**
 * `purchases.purchase_requisition_status_history` — ledger append-only
 * (mismo patrón que `SupplierBlockHistoryRepository` de `proveedores`):
 * cada transición de estado agrega una fila nueva, nunca se actualiza
 * una existente.
 */
export abstract class HistorialEstadoSolicitudRepository {
  abstract registrar(
    context: UserContext,
    params: RegistrarTransicionParams,
  ): Promise<purchase_requisition_status_history>;

  abstract listar(
    context: UserContext,
    requisitionId: string,
  ): Promise<purchase_requisition_status_history[]>;
}
