import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_SALES } from '@gorazus/core-database';
import type { SalesPrismaClient } from '@gorazus/core-database';
import { EstadoPedidoRepository } from './estado-pedido.repository';

@Injectable()
export class EstadoPedidoRepositoryPrisma extends EstadoPedidoRepository {
  constructor(@Inject(PRISMA_SALES) client: SalesPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.sales_order_status.findUnique(args),
      findMany: (args) => tx.sales_order_status.findMany(args),
      count: (args) => tx.sales_order_status.count(args),
      create: (args) => tx.sales_order_status.create(args),
      update: (args) => tx.sales_order_status.update(args),
    }));
  }
}
