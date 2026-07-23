import { BaseRepository } from '@gorazus/core-database';
import type {
  InventoryPrisma,
  InventoryPrismaClient,
  stock_movement_types,
} from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

/** Adaptador sobre `inventory.stock_movement_types` (docs/architecture/19-modulo-inventory.md, catálogo). */
export abstract class TipoMovimientoStockRepository extends BaseRepository<
  InventoryPrisma.stock_movement_typesWhereUniqueInput,
  InventoryPrisma.stock_movement_typesWhereInput,
  InventoryPrisma.stock_movement_typesUncheckedCreateInput,
  InventoryPrisma.stock_movement_typesUncheckedUpdateInput,
  stock_movement_types,
  InventoryPrismaClient
> {
  /** `code` es único por tenant vía índice parcial — validado en `TiposMovimientoService`. */
  abstract existeCodigo(context: UserContext, code: string): Promise<boolean>;
  /** Un tipo con movimientos ya registrados no puede cambiar de `direction` (`INVENTORY_ARCHITECTURE.md §6` — el kardex lee la dirección vigente, no una copia congelada por movimiento). */
  abstract tieneMovimientos(context: UserContext, movementTypeId: string): Promise<boolean>;
}
