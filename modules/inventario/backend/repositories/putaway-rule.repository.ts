import { BaseRepository } from '@gorazus/core-database';
import type { InventoryPrisma, InventoryPrismaClient, putaway_rules } from '@gorazus/core-database';

/** Adaptador sobre `inventory.putaway_rules` (catálogo configurable, mismo patrón que `MotivoAjusteRepository`). */
export abstract class PutawayRuleRepository extends BaseRepository<
  InventoryPrisma.putaway_rulesWhereUniqueInput,
  InventoryPrisma.putaway_rulesWhereInput,
  InventoryPrisma.putaway_rulesUncheckedCreateInput,
  InventoryPrisma.putaway_rulesUncheckedUpdateInput,
  putaway_rules,
  InventoryPrismaClient
> {}
