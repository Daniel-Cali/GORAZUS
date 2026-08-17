import type { purchase_order_status_history } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

export interface RegistrarTransicionOrdenParams {
  purchaseOrderId: string;
  companyId: string;
  branchId: string | null;
  statusId: string;
}

/**
 * `purchases.purchase_order_status_history` — ledger append-only, mismo
 * patrón que `HistorialEstadoSolicitudRepository`.
 */
export abstract class HistorialEstadoOrdenRepository {
  abstract registrar(
    context: UserContext,
    params: RegistrarTransicionOrdenParams,
  ): Promise<purchase_order_status_history>;

  abstract listar(
    context: UserContext,
    purchaseOrderId: string,
  ): Promise<purchase_order_status_history[]>;
}
