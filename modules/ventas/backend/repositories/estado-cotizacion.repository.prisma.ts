import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_SALES } from '@gorazus/core-database';
import type { SalesPrismaClient } from '@gorazus/core-database';
import { EstadoCotizacionRepository } from './estado-cotizacion.repository';

@Injectable()
export class EstadoCotizacionRepositoryPrisma extends EstadoCotizacionRepository {
  constructor(@Inject(PRISMA_SALES) client: SalesPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.quote_status.findUnique(args),
      findMany: (args) => tx.quote_status.findMany(args),
      count: (args) => tx.quote_status.count(args),
      create: (args) => tx.quote_status.create(args),
      update: (args) => tx.quote_status.update(args),
    }));
  }
}
