import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_PURCHASES } from '@gorazus/core-database';
import type { PurchasesPrismaClient } from '@gorazus/core-database';
import { EstadoSolicitudCompraRepository } from './estado-solicitud-compra.repository';

@Injectable()
export class EstadoSolicitudCompraRepositoryPrisma extends EstadoSolicitudCompraRepository {
  constructor(@Inject(PRISMA_PURCHASES) client: PurchasesPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.purchase_requisition_status.findUnique(args),
      findMany: (args) => tx.purchase_requisition_status.findMany(args),
      count: (args) => tx.purchase_requisition_status.count(args),
      create: (args) => tx.purchase_requisition_status.create(args),
      update: (args) => tx.purchase_requisition_status.update(args),
    }));
  }
}
