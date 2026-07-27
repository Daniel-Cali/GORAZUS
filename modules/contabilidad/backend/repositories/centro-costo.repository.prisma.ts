import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_ACCOUNTING } from '@gorazus/core-database';
import type { AccountingPrismaClient } from '@gorazus/core-database';
import { CentroCostoRepository } from './centro-costo.repository';

@Injectable()
export class CentroCostoRepositoryPrisma extends CentroCostoRepository {
  constructor(@Inject(PRISMA_ACCOUNTING) client: AccountingPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.cost_centers.findUnique(args),
      findMany: (args) => tx.cost_centers.findMany(args),
      count: (args) => tx.cost_centers.count(args),
      create: (args) => tx.cost_centers.create(args),
      update: (args) => tx.cost_centers.update(args),
    }));
  }
}
