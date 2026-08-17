import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_PURCHASES } from '@gorazus/core-database';
import type { PurchasesPrismaClient } from '@gorazus/core-database';
import { EstadoImportacionRepository } from './estado-importacion.repository';

@Injectable()
export class EstadoImportacionRepositoryPrisma extends EstadoImportacionRepository {
  constructor(@Inject(PRISMA_PURCHASES) client: PurchasesPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.import_status.findUnique(args),
      findMany: (args) => tx.import_status.findMany(args),
      count: (args) => tx.import_status.count(args),
      create: (args) => tx.import_status.create(args),
      update: (args) => tx.import_status.update(args),
    }));
  }
}
