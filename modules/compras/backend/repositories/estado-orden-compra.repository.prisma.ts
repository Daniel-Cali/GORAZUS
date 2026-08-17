import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_PURCHASES } from '@gorazus/core-database';
import type { PurchasesPrismaClient } from '@gorazus/core-database';
import { EstadoOrdenCompraRepository } from './estado-orden-compra.repository';

@Injectable()
export class EstadoOrdenCompraRepositoryPrisma extends EstadoOrdenCompraRepository {
  constructor(@Inject(PRISMA_PURCHASES) client: PurchasesPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.purchase_order_status.findUnique(args),
      findMany: (args) => tx.purchase_order_status.findMany(args),
      count: (args) => tx.purchase_order_status.count(args),
      create: (args) => tx.purchase_order_status.create(args),
      update: (args) => tx.purchase_order_status.update(args),
    }));
  }
}
