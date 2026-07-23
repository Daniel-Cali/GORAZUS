import { BaseRepository } from '@gorazus/core-database';
import type { InventoryPrisma, InventoryPrismaClient, warehouses } from '@gorazus/core-database';

/** Adaptador sobre `inventory.warehouses` (docs/architecture/19-modulo-inventory.md §1). */
export abstract class AlmacenRepository extends BaseRepository<
  InventoryPrisma.warehousesWhereUniqueInput,
  InventoryPrisma.warehousesWhereInput,
  InventoryPrisma.warehousesUncheckedCreateInput,
  InventoryPrisma.warehousesUncheckedUpdateInput,
  warehouses,
  InventoryPrismaClient
> {}
