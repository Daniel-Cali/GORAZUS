import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_INVENTORY } from '@gorazus/core-database';
import type { InventoryPrismaClient } from '@gorazus/core-database';
import { PickingRuleRepository } from './picking-rule.repository';

@Injectable()
export class PickingRuleRepositoryPrisma extends PickingRuleRepository {
  constructor(@Inject(PRISMA_INVENTORY) client: InventoryPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.picking_rules.findUnique(args),
      findMany: (args) => tx.picking_rules.findMany(args),
      count: (args) => tx.picking_rules.count(args),
      create: (args) => tx.picking_rules.create(args),
      update: (args) => tx.picking_rules.update(args),
    }));
  }
}
