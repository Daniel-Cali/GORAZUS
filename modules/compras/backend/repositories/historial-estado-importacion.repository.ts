import type { import_status_history } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

export interface RegistrarTransicionImportacionParams {
  importId: string;
  companyId: string;
  branchId: string | null;
  statusId: string;
}

/**
 * `purchases.import_status_history` — ledger append-only, mismo patrón
 * que `HistorialEstadoOrdenRepository`/`HistorialEstadoFacturaRepository`.
 */
export abstract class HistorialEstadoImportacionRepository {
  abstract registrar(
    context: UserContext,
    params: RegistrarTransicionImportacionParams,
  ): Promise<import_status_history>;

  abstract listar(context: UserContext, importId: string): Promise<import_status_history[]>;
}
