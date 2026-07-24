import { BaseRepository } from '@gorazus/core-database';
import type {
  InventoryPrisma,
  InventoryPrismaClient,
  stock_adjustment_reasons,
} from '@gorazus/core-database';

/** Adaptador sobre `inventory.stock_adjustment_reasons` (catálogo, mismo patrón que `TipoMovimientoStockRepository`). */
export abstract class MotivoAjusteRepository extends BaseRepository<
  InventoryPrisma.stock_adjustment_reasonsWhereUniqueInput,
  InventoryPrisma.stock_adjustment_reasonsWhereInput,
  InventoryPrisma.stock_adjustment_reasonsUncheckedCreateInput,
  InventoryPrisma.stock_adjustment_reasonsUncheckedUpdateInput,
  stock_adjustment_reasons,
  InventoryPrismaClient
> {}
