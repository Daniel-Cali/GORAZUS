import type {
  PurchasesPrisma,
  purchase_invoices,
  purchase_invoice_lines,
} from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

export interface LineaFacturaCompraParams {
  productId: string;
  quantity: number;
  unitCost: number;
  taxId: string | null;
}

export interface CrearFacturaCompraParams {
  companyId: string;
  branchId: string | null;
  supplierId: string;
  supplierDocumentNumber: string;
  purchaseOrderId: string | null;
  statusId: string;
  currencyCode: string;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  lines: LineaFacturaCompraParams[];
}

export type ActualizarFacturaCompraParams = Pick<
  CrearFacturaCompraParams,
  'subtotalAmount' | 'taxAmount' | 'totalAmount' | 'lines'
>;

export type FacturaCompraConLineas = purchase_invoices & {
  purchase_invoice_lines: purchase_invoice_lines[];
};

/**
 * `purchases.purchase_invoices`/`purchase_invoice_lines` — la cabecera
 * está **particionada por rango de `received_at`** (PK compuesta
 * `(id, received_at)`), y las líneas/historial **no tienen FK real**
 * hacia la cabecera (limitación de Postgres con tablas particionadas).
 * Consecuencias de diseño, a diferencia de `OrdenCompraRepository`/
 * `SolicitudCompraRepository`:
 * - Sin `create`/`include` anidado — cabecera y líneas se crean por
 *   separado, dentro de la misma transacción de `withTenantScope`.
 * - Lookups por `id` usan `findFirst`, nunca `findUnique` (la única
 *   combinación realmente única para Prisma es `id_received_at`, y no
 *   se conoce `received_at` de antemano desde una URL `/facturas/:id`).
 * - Escrituras usan `updateMany` con `where: { id }` (no `update`, que
 *   exigiría la clave compuesta) — la integridad ("¿existe la fila?")
 *   se verifica antes con `findFirst`, mismo patrón que el resto de
 *   `compras`.
 */
export abstract class FacturaCompraRepository {
  abstract crear(
    context: UserContext,
    params: CrearFacturaCompraParams,
  ): Promise<FacturaCompraConLineas>;

  abstract obtener(context: UserContext, id: string): Promise<FacturaCompraConLineas | null>;

  abstract listar(
    context: UserContext,
    filter: PurchasesPrisma.purchase_invoicesWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<purchase_invoices>>;

  abstract actualizarEstado(
    context: UserContext,
    id: string,
    statusId: string,
  ): Promise<purchase_invoices>;

  /** Reemplaza las líneas existentes — solo válido sobre un borrador, la regla la aplica el servicio. */
  abstract actualizar(
    context: UserContext,
    id: string,
    params: ActualizarFacturaCompraParams,
  ): Promise<FacturaCompraConLineas>;

  abstract eliminar(context: UserContext, id: string): Promise<purchase_invoices>;

  /** Duplicidad de referencia fiscal (proveedor + número de documento), entre facturas activas. */
  abstract existeConReferencia(
    context: UserContext,
    supplierId: string,
    supplierDocumentNumber: string,
    excludingId?: string,
  ): Promise<boolean>;
}
