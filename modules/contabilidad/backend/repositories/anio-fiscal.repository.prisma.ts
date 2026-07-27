import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_ACCOUNTING } from '@gorazus/core-database';
import type { AccountingPrismaClient } from '@gorazus/core-database';
import { AnioFiscalRepository } from './anio-fiscal.repository';

@Injectable()
export class AnioFiscalRepositoryPrisma extends AnioFiscalRepository {
  constructor(@Inject(PRISMA_ACCOUNTING) client: AccountingPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.fiscal_years.findUnique(args),
      findMany: (args) => tx.fiscal_years.findMany(args),
      count: (args) => tx.fiscal_years.count(args),
      create: (args) => tx.fiscal_years.create(args),
      update: (args) => tx.fiscal_years.update(args),
    }));
  }
}
