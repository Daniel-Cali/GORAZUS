import type { import_expenses } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

export interface CrearGastoImportacionParams {
  companyId: string;
  branchId: string | null;
  importId: string;
  expenseType: string;
  amount: number;
}

/**
 * `purchases.import_expenses` — gastos agregados incrementalmente a un
 * expediente de importación (flete, seguro, aduana, otros).
 */
export abstract class GastoImportacionRepository {
  abstract crear(
    context: UserContext,
    params: CrearGastoImportacionParams,
  ): Promise<import_expenses>;

  abstract obtener(context: UserContext, id: string): Promise<import_expenses | null>;

  abstract anular(context: UserContext, id: string): Promise<import_expenses>;
}
