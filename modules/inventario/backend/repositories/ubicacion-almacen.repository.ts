import { BaseRepository } from '@gorazus/core-database';
import type {
  InventoryPrisma,
  InventoryPrismaClient,
  warehouse_locations,
} from '@gorazus/core-database';

/** Adaptador sobre `inventory.warehouse_locations` (docs/architecture/19-modulo-inventory.md §2). */
export abstract class UbicacionAlmacenRepository extends BaseRepository<
  InventoryPrisma.warehouse_locationsWhereUniqueInput,
  InventoryPrisma.warehouse_locationsWhereInput,
  InventoryPrisma.warehouse_locationsUncheckedCreateInput,
  InventoryPrisma.warehouse_locationsUncheckedUpdateInput,
  warehouse_locations,
  InventoryPrismaClient
> {}
