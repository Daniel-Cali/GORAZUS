import { BaseRepository } from '@gorazus/core-database';
import type {
  InventoryPrisma,
  InventoryPrismaClient,
  warehouse_zones,
} from '@gorazus/core-database';

/** Adaptador sobre `inventory.warehouse_zones` (docs/architecture/19-modulo-inventory.md §2). */
export abstract class ZonaAlmacenRepository extends BaseRepository<
  InventoryPrisma.warehouse_zonesWhereUniqueInput,
  InventoryPrisma.warehouse_zonesWhereInput,
  InventoryPrisma.warehouse_zonesUncheckedCreateInput,
  InventoryPrisma.warehouse_zonesUncheckedUpdateInput,
  warehouse_zones,
  InventoryPrismaClient
> {}
