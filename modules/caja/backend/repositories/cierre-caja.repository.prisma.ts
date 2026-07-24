import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CASH } from '@gorazus/core-database';
import type { CashPrismaClient } from '@gorazus/core-database';
import { CierreCajaRepository } from './cierre-caja.repository';

@Injectable()
export class CierreCajaRepositoryPrisma extends CierreCajaRepository {
  constructor(@Inject(PRISMA_CASH) client: CashPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.cash_register_closings.findUnique(args),
      findMany: (args) => tx.cash_register_closings.findMany(args),
      count: (args) => tx.cash_register_closings.count(args),
      create: (args) => tx.cash_register_closings.create(args),
      update: (args) => tx.cash_register_closings.update(args),
    }));
  }
}
