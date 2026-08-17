import type { PurchasesPrisma, imports, import_expenses } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

export interface CrearExpedienteImportacionParams {
  companyId: string;
  branchId: string | null;
  purchaseOrderId: string;
  statusId: string;
}

export type ExpedienteImportacionConGastos = imports & { import_expenses: import_expenses[] };

/**
 * `purchases.imports`/`import_expenses` — `purchase_order_id` **sí
 * tiene FK real** (no está particionada). `import_expenses` no se crea
 * anidado junto con la cabecera — se agrega incrementalmente vía
 * `GastoImportacionRepository`.
 */
export abstract class ExpedienteImportacionRepository {
  abstract crear(context: UserContext, params: CrearExpedienteImportacionParams): Promise<imports>;

  abstract obtener(
    context: UserContext,
    id: string,
  ): Promise<ExpedienteImportacionConGastos | null>;

  abstract listar(
    context: UserContext,
    filter: PurchasesPrisma.importsWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<imports>>;

  abstract actualizarEstado(context: UserContext, id: string, statusId: string): Promise<imports>;

  abstract anular(context: UserContext, id: string): Promise<imports>;
}
