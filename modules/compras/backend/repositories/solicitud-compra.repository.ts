import type {
  PurchasesPrisma,
  purchase_requisitions,
  purchase_requisition_lines,
} from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

export interface LineaSolicitudCompraParams {
  productId: string;
  quantity: number;
}

export interface CrearSolicitudCompraParams {
  companyId: string;
  branchId: string | null;
  requestedByUserId: string;
  statusId: string;
  documentNumber: string;
  lines: LineaSolicitudCompraParams[];
}

export type ActualizarSolicitudCompraParams = Pick<CrearSolicitudCompraParams, 'lines'>;

export type SolicitudCompraConLineas = purchase_requisitions & {
  purchase_requisition_lines: purchase_requisition_lines[];
};

/**
 * `purchases.purchase_requisitions`/`purchase_requisition_lines` — NO
 * particionada, `purchase_requisition_lines` SÍ tiene relación real de
 * Prisma hacia la cabecera (acepta `create` anidado), mismo criterio
 * que `sales.quotes`/`quote_lines` (`CotizacionRepository`).
 */
export abstract class SolicitudCompraRepository {
  abstract crear(
    context: UserContext,
    params: CrearSolicitudCompraParams,
  ): Promise<SolicitudCompraConLineas>;

  abstract obtener(context: UserContext, id: string): Promise<SolicitudCompraConLineas | null>;

  abstract listar(
    context: UserContext,
    filter: PurchasesPrisma.purchase_requisitionsWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<purchase_requisitions>>;

  abstract actualizarEstado(
    context: UserContext,
    id: string,
    statusId: string,
  ): Promise<purchase_requisitions>;

  /** Reemplaza las líneas existentes — solo válido sobre un borrador, la regla la aplica el servicio. */
  abstract actualizar(
    context: UserContext,
    id: string,
    params: ActualizarSolicitudCompraParams,
  ): Promise<SolicitudCompraConLineas>;

  abstract eliminar(context: UserContext, id: string): Promise<purchase_requisitions>;
}
