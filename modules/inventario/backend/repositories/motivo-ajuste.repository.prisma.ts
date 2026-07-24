import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_INVENTORY } from '@gorazus/core-database';
import type { InventoryPrismaClient } from '@gorazus/core-database';
import { MotivoAjusteRepository } from './motivo-ajuste.repository';

@Injectable()
export class MotivoAjusteRepositoryPrisma extends MotivoAjusteRepository {
  constructor(@Inject(PRISMA_INVENTORY) client: InventoryPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.stock_adjustment_reasons.findUnique(args),
      findMany: (args) => tx.stock_adjustment_reasons.findMany(args),
      count: (args) => tx.stock_adjustment_reasons.count(args),
      create: (args) => tx.stock_adjustment_reasons.create(args),
      update: (args) => tx.stock_adjustment_reasons.update(args),
    }));
  }
}
