import { BaseRepository } from '@gorazus/core-database';
import type {
  InventoryPrisma,
  InventoryPrismaClient,
  replenishment_rules,
} from '@gorazus/core-database';

/** Adaptador sobre `inventory.replenishment_rules` (catálogo configurable, mismo patrón que `MotivoAjusteRepository`). */
export abstract class ReplenishmentRuleRepository extends BaseRepository<
  InventoryPrisma.replenishment_rulesWhereUniqueInput,
  InventoryPrisma.replenishment_rulesWhereInput,
  InventoryPrisma.replenishment_rulesUncheckedCreateInput,
  InventoryPrisma.replenishment_rulesUncheckedUpdateInput,
  replenishment_rules,
  InventoryPrismaClient
> {}
