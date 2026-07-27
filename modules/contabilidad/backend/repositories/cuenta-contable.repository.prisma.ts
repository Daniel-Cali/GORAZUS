import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_ACCOUNTING } from '@gorazus/core-database';
import type { AccountingPrismaClient } from '@gorazus/core-database';
import { CuentaContableRepository } from './cuenta-contable.repository';

@Injectable()
export class CuentaContableRepositoryPrisma extends CuentaContableRepository {
  constructor(@Inject(PRISMA_ACCOUNTING) client: AccountingPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.chart_of_accounts.findUnique(args),
      findMany: (args) => tx.chart_of_accounts.findMany(args),
      count: (args) => tx.chart_of_accounts.count(args),
      create: (args) => tx.chart_of_accounts.create(args),
      update: (args) => tx.chart_of_accounts.update(args),
    }));
  }
}
