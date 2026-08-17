import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_PURCHASES } from '@gorazus/core-database';
import type { PurchasesPrismaClient } from '@gorazus/core-database';
import { EstadoFacturaCompraRepository } from './estado-factura-compra.repository';

@Injectable()
export class EstadoFacturaCompraRepositoryPrisma extends EstadoFacturaCompraRepository {
  constructor(@Inject(PRISMA_PURCHASES) client: PurchasesPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.purchase_invoice_status.findUnique(args),
      findMany: (args) => tx.purchase_invoice_status.findMany(args),
      count: (args) => tx.purchase_invoice_status.count(args),
      create: (args) => tx.purchase_invoice_status.create(args),
      update: (args) => tx.purchase_invoice_status.update(args),
    }));
  }
}
