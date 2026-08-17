import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_PURCHASES, withTenantScope } from '@gorazus/core-database';
import type { PurchasesPrismaClient, purchase_order_status_history } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import {
  HistorialEstadoOrdenRepository,
  type RegistrarTransicionOrdenParams,
} from './historial-estado-orden.repository';

@Injectable()
export class HistorialEstadoOrdenRepositoryPrisma extends HistorialEstadoOrdenRepository {
  constructor(@Inject(PRISMA_PURCHASES) private readonly client: PurchasesPrismaClient) {
    super();
  }

  async registrar(
    context: UserContext,
    params: RegistrarTransicionOrdenParams,
  ): Promise<purchase_order_status_history> {
    return withTenantScope(this.client, context, (tx) =>
      tx.purchase_order_status_history.create({
        data: {
          tenant_id: context.tenantId,
          company_id: params.companyId,
          branch_id: params.branchId,
          purchase_order_id: params.purchaseOrderId,
          status_id: params.statusId,
        },
      }),
    );
  }

  async listar(
    context: UserContext,
    purchaseOrderId: string,
  ): Promise<purchase_order_status_history[]> {
    return withTenantScope(this.client, context, (tx) =>
      tx.purchase_order_status_history.findMany({
        where: { purchase_order_id: purchaseOrderId, deleted_at: null },
        orderBy: { created_at: 'asc' },
      }),
    );
  }
}
