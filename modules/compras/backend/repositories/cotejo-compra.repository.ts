import type { PurchasesPrisma, purchase_invoice_matching } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

export interface CrearCotejoCompraParams {
  companyId: string;
  branchId: string | null;
  purchaseOrderId: string;
  receiptNoteId: string;
  purchaseInvoiceId: string;
  discrepancyAmount: number;
  isWithinTolerance: boolean;
}

/**
 * `purchases.purchase_invoice_matching` — resultado calculado del
 * 3-way match, sin flujo de estados. `purchase_invoice_id` no tiene FK
 * real (misma limitación de partición que [[ADR-PUR-005]]/
 * `FacturaCompraRepository`); `purchase_order_id`/`receipt_note_id` sí
 * la tienen.
 */
export abstract class CotejoCompraRepository {
  abstract crear(
    context: UserContext,
    params: CrearCotejoCompraParams,
  ): Promise<purchase_invoice_matching>;

  abstract obtener(context: UserContext, id: string): Promise<purchase_invoice_matching | null>;

  abstract listar(
    context: UserContext,
    filter: PurchasesPrisma.purchase_invoice_matchingWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<purchase_invoice_matching>>;

  abstract anular(context: UserContext, id: string): Promise<purchase_invoice_matching>;
}
