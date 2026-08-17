import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_INVENTORY } from '@gorazus/core-database';
import type { InventoryPrismaClient } from '@gorazus/core-database';
import { PutawayRuleRepository } from './putaway-rule.repository';

@Injectable()
export class PutawayRuleRepositoryPrisma extends PutawayRuleRepository {
  constructor(@Inject(PRISMA_INVENTORY) client: InventoryPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.putaway_rules.findUnique(args),
      findMany: (args) => tx.putaway_rules.findMany(args),
      count: (args) => tx.putaway_rules.count(args),
      create: (args) => tx.putaway_rules.create(args),
      update: (args) => tx.putaway_rules.update(args),
    }));
  }
}
