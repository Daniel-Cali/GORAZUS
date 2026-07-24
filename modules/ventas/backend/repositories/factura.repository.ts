import type { SalesPrisma, invoices, invoice_lines } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

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
  lines: Array<{
    productId: string;
    taxId: string | null;
    quantity: number;
    unitPrice: number;
    discountPercentage: number;
    lineTotal: number;
  }>;
}

export type FacturaConLineas = invoices & { invoice_lines: invoice_lines[] };

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
  ): Promise<PaginatedResult<invoices>>;

  abstract actualizarEstado(context: UserContext, id: string, statusId: string): Promise<invoices>;
}
