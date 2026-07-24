import { BaseRepository } from '@gorazus/core-database';
import type {
  InventoryPrisma,
  InventoryPrismaClient,
  cycle_count_schedules,
} from '@gorazus/core-database';

/** Adaptador sobre `inventory.cycle_count_schedules`. */
export abstract class ProgramaConteoCiclicoRepository extends BaseRepository<
  InventoryPrisma.cycle_count_schedulesWhereUniqueInput,
  InventoryPrisma.cycle_count_schedulesWhereInput,
  InventoryPrisma.cycle_count_schedulesUncheckedCreateInput,
  InventoryPrisma.cycle_count_schedulesUncheckedUpdateInput,
  cycle_count_schedules,
  InventoryPrismaClient
> {}
