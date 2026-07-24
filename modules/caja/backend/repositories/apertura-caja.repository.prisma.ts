import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CASH } from '@gorazus/core-database';
import type { CashPrismaClient } from '@gorazus/core-database';
import { AperturaCajaRepository } from './apertura-caja.repository';

@Injectable()
export class AperturaCajaRepositoryPrisma extends AperturaCajaRepository {
  constructor(@Inject(PRISMA_CASH) client: CashPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.cash_register_openings.findUnique(args),
      findMany: (args) => tx.cash_register_openings.findMany(args),
      count: (args) => tx.cash_register_openings.count(args),
      create: (args) => tx.cash_register_openings.create(args),
      update: (args) => tx.cash_register_openings.update(args),
    }));
  }
}
