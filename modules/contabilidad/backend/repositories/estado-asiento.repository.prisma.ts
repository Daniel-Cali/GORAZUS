import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_ACCOUNTING } from '@gorazus/core-database';
import type { AccountingPrismaClient } from '@gorazus/core-database';
import { EstadoAsientoRepository } from './estado-asiento.repository';

@Injectable()
export class EstadoAsientoRepositoryPrisma extends EstadoAsientoRepository {
  constructor(@Inject(PRISMA_ACCOUNTING) client: AccountingPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.journal_entry_status.findUnique(args),
      findMany: (args) => tx.journal_entry_status.findMany(args),
      count: (args) => tx.journal_entry_status.count(args),
      create: (args) => tx.journal_entry_status.create(args),
      update: (args) => tx.journal_entry_status.update(args),
    }));
  }
}
