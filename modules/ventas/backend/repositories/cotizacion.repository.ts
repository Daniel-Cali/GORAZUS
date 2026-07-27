import type { SalesPrisma, quotes, quote_lines } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

export interface LineaCotizacionParams {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPercentage: number;
}

export interface CrearCotizacionParams {
  companyId: string;
  branchId: string;
  customerId: string;
  salespersonId?: string | null;
  statusId: string;
  currencyCode: string;
  documentNumber: string;
  totalAmount: number;
  validUntil?: Date | null;
  lines: LineaCotizacionParams[];
}

export type ActualizarCotizacionParams = Omit<CrearCotizacionParams, 'statusId' | 'documentNumber'>;

export type CotizacionConLineas = quotes & { quote_lines: quote_lines[] };

export type OrdenCotizacion = 'created_at' | 'total_amount' | 'document_number' | 'valid_until';

/**
 * `sales.quotes`/`quote_lines` — a diferencia de `sales.invoices`, NO
 * está particionada y `quote_lines` SÍ tiene relación real de Prisma
 * hacia `quotes` — acepta `create`/`update` anidado en una sola
 * escritura (mismo criterio que `accounting_rules`/`accounting_rule_lines`).
 */
export abstract class CotizacionRepository {
  abstract crear(context: UserContext, params: CrearCotizacionParams): Promise<CotizacionConLineas>;

  abstract obtener(context: UserContext, id: string): Promise<CotizacionConLineas | null>;

  abstract listar(
    context: UserContext,
    filter: SalesPrisma.quotesWhereInput,
    pagination: PaginationParams,
    orden?: { campo: OrdenCotizacion; direccion: 'asc' | 'desc' },
  ): Promise<PaginatedResult<quotes>>;

  abstract actualizarEstado(context: UserContext, id: string, statusId: string): Promise<quotes>;

  /** Reemplaza las líneas existentes — solo válido sobre un borrador, la regla la aplica el servicio. */
  abstract actualizar(
    context: UserContext,
    id: string,
    params: ActualizarCotizacionParams,
  ): Promise<CotizacionConLineas>;

  abstract eliminar(context: UserContext, id: string): Promise<quotes>;
}
