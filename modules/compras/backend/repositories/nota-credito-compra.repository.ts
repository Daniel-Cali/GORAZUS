import type {
  PurchasesPrisma,
  purchase_credit_notes,
  purchase_credit_note_lines,
} from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

export interface LineaNotaCreditoCompraParams {
  productId: string;
  quantity: number;
}

export interface CrearNotaCreditoCompraParams {
  companyId: string;
  branchId: string | null;
  purchaseInvoiceId: string;
  totalAmount: number;
  lines: LineaNotaCreditoCompraParams[];
}

export type ActualizarNotaCreditoCompraParams = Pick<
  CrearNotaCreditoCompraParams,
  'totalAmount' | 'lines'
>;

export type NotaCreditoCompraConLineas = purchase_credit_notes & {
  purchase_credit_note_lines: purchase_credit_note_lines[];
};

/**
 * `purchases.purchase_credit_notes`/`purchase_credit_note_lines` — sin
 * columna de estado en el schema real (mismo motivo que
 * `DevolucionCompraRepository`); `purchase_invoice_id` sin FK real
 * (misma limitación de partición). `purchase_credit_note_lines` sí
 * tiene FK real hacia la cabecera — admite `create` anidado.
 */
export abstract class NotaCreditoCompraRepository {
  abstract crear(
    context: UserContext,
    params: CrearNotaCreditoCompraParams,
  ): Promise<NotaCreditoCompraConLineas>;

  abstract obtener(context: UserContext, id: string): Promise<NotaCreditoCompraConLineas | null>;

  abstract listar(
    context: UserContext,
    filter: PurchasesPrisma.purchase_credit_notesWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<purchase_credit_notes>>;

  /** Reemplaza las líneas existentes — solo válido mientras la nota sigue activa, la regla la aplica el servicio. */
  abstract actualizar(
    context: UserContext,
    id: string,
    params: ActualizarNotaCreditoCompraParams,
  ): Promise<NotaCreditoCompraConLineas>;

  abstract anular(context: UserContext, id: string): Promise<purchase_credit_notes>;

  /** Suma de cantidades ya acreditadas (notas activas, sin contar `id` en curso) para un producto de una factura — usada para no exceder lo facturado. */
  abstract sumarCantidadAcreditada(
    context: UserContext,
    purchaseInvoiceId: string,
    productId: string,
    excludingCreditNoteId?: string,
  ): Promise<number>;
}
