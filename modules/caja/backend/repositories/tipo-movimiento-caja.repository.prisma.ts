import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CASH } from '@gorazus/core-database';
import type { CashPrismaClient } from '@gorazus/core-database';
import { TipoMovimientoCajaRepository } from './tipo-movimiento-caja.repository';

@Injectable()
export class TipoMovimientoCajaRepositoryPrisma extends TipoMovimientoCajaRepository {
  constructor(@Inject(PRISMA_CASH) client: CashPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.cash_movement_types.findUnique(args),
      findMany: (args) => tx.cash_movement_types.findMany(args),
      count: (args) => tx.cash_movement_types.count(args),
      create: (args) => tx.cash_movement_types.create(args),
      update: (args) => tx.cash_movement_types.update(args),
    }));
  }
}
