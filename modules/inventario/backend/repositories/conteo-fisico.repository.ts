import type {
  InventoryPrisma,
  physical_counts,
  physical_count_lines,
} from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

export interface CrearConteoParams {
  companyId: string;
  branchId: string | null;
  warehouseId: string;
  scheduledDate: Date;
  lines: Array<{ productId: string; systemQuantity: number }>;
}

export type ConteoConLineas = physical_counts & { physical_count_lines: physical_count_lines[] };

/**
 * `inventory.physical_counts` + `physical_count_lines` — mismo patrón
 * que `AjusteStockRepository`/`TransferenciaRepository`: encabezado y
 * líneas se crean juntos, el cambio de estado es aparte. `capturarLinea`
 * es la única escritura permitida sobre una línea después de creada
 * (`counted_quantity`, nunca `system_quantity` — eso es la foto del
 * momento de creación, inmutable).
 */
export abstract class ConteoFisicoRepository {
  abstract crear(context: UserContext, params: CrearConteoParams): Promise<ConteoConLineas>;

  abstract obtener(context: UserContext, id: string): Promise<ConteoConLineas | null>;

  abstract listar(
    context: UserContext,
    filter: InventoryPrisma.physical_countsWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<physical_counts>>;

  abstract actualizarEstado(
    context: UserContext,
    id: string,
    status: 'planned' | 'in_progress' | 'completed',
  ): Promise<physical_counts>;

  abstract capturarLinea(
    context: UserContext,
    lineaId: string,
    countedQuantity: number,
  ): Promise<physical_count_lines>;
}
