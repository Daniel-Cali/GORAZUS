import type {
  PurchasesPrisma,
  purchase_returns,
  purchase_return_lines,
} from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

export interface LineaDevolucionCompraParams {
  productId: string;
  quantity: number;
}

export interface CrearDevolucionCompraParams {
  companyId: string;
  branchId: string | null;
  purchaseInvoiceId: string;
  reason: string | null;
  lines: LineaDevolucionCompraParams[];
}

export type ActualizarDevolucionCompraParams = Pick<CrearDevolucionCompraParams, 'lines'>;

export type DevolucionCompraConLineas = purchase_returns & {
  purchase_return_lines: purchase_return_lines[];
};

/**
 * `purchases.purchase_returns`/`purchase_return_lines` — sin columna de
 * estado en el schema real (mismo motivo que
 * `RecepcionCompraRepository`); `purchase_invoice_id` sin FK real
 * (misma limitación de partición que `purchase_invoice_lines`, ver
 * [[ADR-PUR-005]]). `purchase_return_lines` **sí tiene** FK real hacia
 * la cabecera (`purchase_returns` no está particionada) — admite
 * `create` anidado.
 */
export abstract class DevolucionCompraRepository {
  abstract crear(
    context: UserContext,
    params: CrearDevolucionCompraParams,
  ): Promise<DevolucionCompraConLineas>;

  abstract obtener(context: UserContext, id: string): Promise<DevolucionCompraConLineas | null>;

  abstract listar(
    context: UserContext,
    filter: PurchasesPrisma.purchase_returnsWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<purchase_returns>>;

  /** Reemplaza las líneas existentes — solo válido mientras la devolución sigue activa, la regla la aplica el servicio. */
  abstract actualizar(
    context: UserContext,
    id: string,
    params: ActualizarDevolucionCompraParams,
  ): Promise<DevolucionCompraConLineas>;

  abstract anular(context: UserContext, id: string): Promise<purchase_returns>;

  /** Suma de cantidades ya devueltas (devoluciones activas, sin contar `id` en curso) para un producto de una factura — usada para no exceder lo facturado. */
  abstract sumarCantidadDevuelta(
    context: UserContext,
    purchaseInvoiceId: string,
    productId: string,
    excludingReturnId?: string,
  ): Promise<number>;
}
