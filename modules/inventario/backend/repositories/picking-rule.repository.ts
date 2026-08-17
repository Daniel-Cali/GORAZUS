import { BaseRepository } from '@gorazus/core-database';
import type { InventoryPrisma, InventoryPrismaClient, picking_rules } from '@gorazus/core-database';

/** Adaptador sobre `inventory.picking_rules` (catálogo configurable, mismo patrón que `MotivoAjusteRepository`). */
export abstract class PickingRuleRepository extends BaseRepository<
  InventoryPrisma.picking_rulesWhereUniqueInput,
  InventoryPrisma.picking_rulesWhereInput,
  InventoryPrisma.picking_rulesUncheckedCreateInput,
  InventoryPrisma.picking_rulesUncheckedUpdateInput,
  picking_rules,
  InventoryPrismaClient
> {}
