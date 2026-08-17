import type {
  PurchasesPrisma,
  goods_receipt_notes,
  goods_receipt_note_lines,
} from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

export interface LineaRecepcionCompraParams {
  productId: string;
  quantity: number;
}

export interface CrearRecepcionCompraParams {
  companyId: string;
  branchId: string | null;
  purchaseOrderId: string;
  lines: LineaRecepcionCompraParams[];
  /** ISSUE-07: si se provee, `crear` es idempotente por `(tenant_id, idempotencyKey)` — ver `RecepcionCompraRepositoryPrisma.crear`. */
  idempotencyKey: string | null;
}

export type ActualizarRecepcionCompraParams = Pick<CrearRecepcionCompraParams, 'lines'>;

export type RecepcionCompraConLineas = goods_receipt_notes & {
  goods_receipt_note_lines: goods_receipt_note_lines[];
};

/**
 * `purchases.goods_receipt_notes`/`goods_receipt_note_lines` — sin
 * columna de estado en el schema real (a diferencia de
 * `SolicitudCompraRepository`/`OrdenCompraRepository`); "activa" vs.
 * "anulada" se resuelve con `deleted_at`, no con un catálogo.
 */
export abstract class RecepcionCompraRepository {
  abstract crear(
    context: UserContext,
    params: CrearRecepcionCompraParams,
  ): Promise<RecepcionCompraConLineas>;

  /** ISSUE-07: lookup de solo lectura por clave de idempotencia — usado por el servicio para saltar validaciones si ya existe. */
  abstract obtenerPorIdempotencyKey(
    context: UserContext,
    idempotencyKey: string,
  ): Promise<RecepcionCompraConLineas | null>;

  abstract obtener(context: UserContext, id: string): Promise<RecepcionCompraConLineas | null>;

  abstract listar(
    context: UserContext,
    filter: PurchasesPrisma.goods_receipt_notesWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<goods_receipt_notes>>;

  /** Reemplaza las líneas existentes — solo válido mientras la recepción sigue activa, la regla la aplica el servicio. */
  abstract actualizar(
    context: UserContext,
    id: string,
    params: ActualizarRecepcionCompraParams,
  ): Promise<RecepcionCompraConLineas>;

  abstract anular(context: UserContext, id: string): Promise<goods_receipt_notes>;

  /** Suma de cantidades ya recibidas (recepciones activas, sin contar `id` en curso) para un producto de una orden — usada para no exceder lo ordenado. */
  abstract sumarCantidadRecibida(
    context: UserContext,
    purchaseOrderId: string,
    productId: string,
    excludingReceiptId?: string,
  ): Promise<number>;
}
