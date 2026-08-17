import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_INVENTORY } from '@gorazus/core-database';
import type { InventoryPrismaClient } from '@gorazus/core-database';
import { ReplenishmentRuleRepository } from './replenishment-rule.repository';

@Injectable()
export class ReplenishmentRuleRepositoryPrisma extends ReplenishmentRuleRepository {
  constructor(@Inject(PRISMA_INVENTORY) client: InventoryPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.replenishment_rules.findUnique(args),
      findMany: (args) => tx.replenishment_rules.findMany(args),
      count: (args) => tx.replenishment_rules.count(args),
      create: (args) => tx.replenishment_rules.create(args),
      update: (args) => tx.replenishment_rules.update(args),
    }));
  }
}
