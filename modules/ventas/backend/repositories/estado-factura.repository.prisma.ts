import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_SALES } from '@gorazus/core-database';
import type { SalesPrismaClient } from '@gorazus/core-database';
import { EstadoFacturaRepository } from './estado-factura.repository';

@Injectable()
export class EstadoFacturaRepositoryPrisma extends EstadoFacturaRepository {
  constructor(@Inject(PRISMA_SALES) client: SalesPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.invoice_status.findUnique(args),
      findMany: (args) => tx.invoice_status.findMany(args),
      count: (args) => tx.invoice_status.count(args),
      create: (args) => tx.invoice_status.create(args),
      update: (args) => tx.invoice_status.update(args),
    }));
  }
}
