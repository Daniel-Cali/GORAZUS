import type {
  PurchasesPrisma,
  purchase_orders,
  purchase_order_lines,
} from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

export interface LineaOrdenCompraParams {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface CrearOrdenCompraParams {
  companyId: string;
  branchId: string;
  supplierId: string;
  requisitionId: string | null;
  statusId: string;
  currencyCode: string;
  documentNumber: string;
  totalAmount: number;
  lines: LineaOrdenCompraParams[];
}

export type ActualizarOrdenCompraParams = Pick<CrearOrdenCompraParams, 'totalAmount' | 'lines'>;

export type OrdenCompraConLineas = purchase_orders & {
  purchase_order_lines: purchase_order_lines[];
};

/**
 * `purchases.purchase_orders`/`purchase_order_lines` — NO particionada,
 * `purchase_order_lines` SÍ tiene relación real de Prisma hacia la
 * cabecera (acepta `create` anidado), mismo criterio que
 * `SolicitudCompraRepository`/`CotizacionRepository`.
 */
export abstract class OrdenCompraRepository {
  abstract crear(
    context: UserContext,
    params: CrearOrdenCompraParams,
  ): Promise<OrdenCompraConLineas>;

  abstract obtener(context: UserContext, id: string): Promise<OrdenCompraConLineas | null>;

  abstract listar(
    context: UserContext,
    filter: PurchasesPrisma.purchase_ordersWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<purchase_orders>>;

  abstract actualizarEstado(
    context: UserContext,
    id: string,
    statusId: string,
  ): Promise<purchase_orders>;

  /** Reemplaza las líneas existentes — solo válido sobre un borrador, la regla la aplica el servicio. */
  abstract actualizar(
    context: UserContext,
    id: string,
    params: ActualizarOrdenCompraParams,
  ): Promise<OrdenCompraConLineas>;

  abstract eliminar(context: UserContext, id: string): Promise<purchase_orders>;
}
