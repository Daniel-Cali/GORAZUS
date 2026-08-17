import type { PurchasesPrisma, purchase_withholdings } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

export interface CrearRetencionCompraParams {
  companyId: string;
  branchId: string | null;
  purchaseInvoiceId: string;
  withholdingRuleId: string | null;
  amount: number;
}

export type ActualizarRetencionCompraParams = Pick<
  CrearRetencionCompraParams,
  'withholdingRuleId' | 'amount'
>;

/**
 * `purchases.purchase_withholdings` — sin líneas propias ni columna de
 * estado en el schema real. `purchase_invoice_id` sin FK real (misma
 * limitación de partición que en el resto de tablas hijas de
 * `purchase_invoices`).
 */
export abstract class RetencionCompraRepository {
  abstract crear(
    context: UserContext,
    params: CrearRetencionCompraParams,
  ): Promise<purchase_withholdings>;

  abstract obtener(context: UserContext, id: string): Promise<purchase_withholdings | null>;

  abstract listar(
    context: UserContext,
    filter: PurchasesPrisma.purchase_withholdingsWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<purchase_withholdings>>;

  abstract actualizar(
    context: UserContext,
    id: string,
    params: ActualizarRetencionCompraParams,
  ): Promise<purchase_withholdings>;

  abstract anular(context: UserContext, id: string): Promise<purchase_withholdings>;

  /** Suma de montos ya retenidos (retenciones activas, sin contar `id` en curso) para una factura — usada para no exceder su total. */
  abstract sumarMontoRetenido(
    context: UserContext,
    purchaseInvoiceId: string,
    excludingWithholdingId?: string,
  ): Promise<number>;
}
