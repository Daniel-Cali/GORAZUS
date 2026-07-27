import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_ACCOUNTING } from '@gorazus/core-database';
import type { AccountingPrismaClient } from '@gorazus/core-database';
import { PeriodoFiscalRepository } from './periodo-fiscal.repository';

@Injectable()
export class PeriodoFiscalRepositoryPrisma extends PeriodoFiscalRepository {
  constructor(@Inject(PRISMA_ACCOUNTING) client: AccountingPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.fiscal_periods.findUnique(args),
      findMany: (args) => tx.fiscal_periods.findMany(args),
      count: (args) => tx.fiscal_periods.count(args),
      create: (args) => tx.fiscal_periods.create(args),
      update: (args) => tx.fiscal_periods.update(args),
    }));
  }
}
