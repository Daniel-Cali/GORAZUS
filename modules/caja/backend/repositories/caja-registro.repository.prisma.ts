import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CASH } from '@gorazus/core-database';
import type { CashPrismaClient } from '@gorazus/core-database';
import { CajaRegistroRepository } from './caja-registro.repository';

@Injectable()
export class CajaRegistroRepositoryPrisma extends CajaRegistroRepository {
  constructor(@Inject(PRISMA_CASH) client: CashPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.cash_registers.findUnique(args),
      findMany: (args) => tx.cash_registers.findMany(args),
      count: (args) => tx.cash_registers.count(args),
      create: (args) => tx.cash_registers.create(args),
      update: (args) => tx.cash_registers.update(args),
    }));
  }
}
