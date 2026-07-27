import type { SalesPrisma, invoices, invoice_lines } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

export interface LineaFacturaParams {
  productId: string;
  taxId: string | null;
  quantity: number;
  unitPrice: number;
  discountPercentage: number;
  lineTotal: number;
}

export interface CrearFacturaParams {
  companyId: string;
  branchId: string;
  customerId: string;
  statusId: string;
  salesChannel: string;
  currencyCode: string;
  documentNumber: string;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  generalDiscountPercentage: number;
  /** Pedido de origen (Módulo de Ventas Enterprise, Parte 1) — `null` para una factura directa, sin pedido previo (POS, mismo comportamiento que hasta ahora). */
  salesOrderId?: string | null;
  lines: LineaFacturaParams[];
}

export interface ActualizarFacturaParams {
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  generalDiscountPercentage: number;
  lines: LineaFacturaParams[];
}

export type FacturaConLineas = invoices & { invoice_lines: invoice_lines[] };

/** Orden soportado por `listar()` — deliberadamente chico (3 columnas reales, no un `orderBy` arbitrario del cliente). */
export type OrdenFactura = 'issued_at' | 'total_amount' | 'document_number';

/**
 * `sales.invoices` — particionada anualmente por `issued_at`
 * (`docs/database/sql/07_sales.sql`), mismo motivo que
 * `MovimientoStockRepository` para no extender `BaseRepository`: el
 * cliente Prisma generado solo expone la clave única compuesta
 * `(id, issued_at)`, nunca `id` a secas. Encabezado + líneas se crean
 * juntos en la misma transacción, mismo patrón que
 * `AjusteStockRepository`/`ConteoFisicoRepository` (Fase 05 Parte 04).
 */
export abstract class FacturaRepository {
  abstract crear(context: UserContext, params: CrearFacturaParams): Promise<FacturaConLineas>;

  abstract obtener(context: UserContext, id: string): Promise<FacturaConLineas | null>;

  abstract listar(
    context: UserContext,
    filter: SalesPrisma.invoicesWhereInput,
    pagination: PaginationParams,
    orden?: { campo: OrdenFactura; direccion: 'asc' | 'desc' },
  ): Promise<PaginatedResult<invoices>>;

  abstract actualizarEstado(context: UserContext, id: string, statusId: string): Promise<invoices>;

  /** Reemplaza las líneas existentes (delete + insert, misma transacción) — solo válido sobre un borrador, la regla la aplica el servicio. */
  abstract actualizar(
    context: UserContext,
    id: string,
    params: ActualizarFacturaParams,
  ): Promise<FacturaConLineas>;

  /** Baja lógica — solo válido sobre un borrador, la regla la aplica el servicio. */
  abstract eliminar(context: UserContext, id: string): Promise<invoices>;
}
