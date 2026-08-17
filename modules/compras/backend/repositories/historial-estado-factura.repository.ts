import type { purchase_invoice_status_history } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

export interface RegistrarTransicionFacturaParams {
  purchaseInvoiceId: string;
  companyId: string;
  branchId: string | null;
  statusId: string;
}

/**
 * `purchases.purchase_invoice_status_history` — ledger append-only,
 * mismo patrón que `HistorialEstadoOrdenRepository`/
 * `HistorialEstadoSolicitudRepository`. `purchase_invoice_id` no tiene
 * FK real (mismo motivo que `purchase_invoice_lines` — la cabecera está
 * particionada).
 */
export abstract class HistorialEstadoFacturaRepository {
  abstract registrar(
    context: UserContext,
    params: RegistrarTransicionFacturaParams,
  ): Promise<purchase_invoice_status_history>;

  abstract listar(
    context: UserContext,
    purchaseInvoiceId: string,
  ): Promise<purchase_invoice_status_history[]>;
}
