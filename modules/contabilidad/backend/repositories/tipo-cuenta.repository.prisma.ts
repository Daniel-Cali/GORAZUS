import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_ACCOUNTING } from '@gorazus/core-database';
import type { AccountingPrismaClient } from '@gorazus/core-database';
import { TipoCuentaRepository } from './tipo-cuenta.repository';

@Injectable()
export class TipoCuentaRepositoryPrisma extends TipoCuentaRepository {
  constructor(@Inject(PRISMA_ACCOUNTING) client: AccountingPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.account_types.findUnique(args),
      findMany: (args) => tx.account_types.findMany(args),
      count: (args) => tx.account_types.count(args),
      create: (args) => tx.account_types.create(args),
      update: (args) => tx.account_types.update(args),
    }));
  }
}
