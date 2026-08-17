import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_PURCHASES, withTenantScope } from '@gorazus/core-database';
import type {
  PurchasesPrismaClient,
  purchase_requisition_status_history,
} from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import {
  HistorialEstadoSolicitudRepository,
  type RegistrarTransicionParams,
} from './historial-estado-solicitud.repository';

@Injectable()
export class HistorialEstadoSolicitudRepositoryPrisma extends HistorialEstadoSolicitudRepository {
  constructor(@Inject(PRISMA_PURCHASES) private readonly client: PurchasesPrismaClient) {
    super();
  }

  async registrar(
    context: UserContext,
    params: RegistrarTransicionParams,
  ): Promise<purchase_requisition_status_history> {
    return withTenantScope(this.client, context, (tx) =>
      tx.purchase_requisition_status_history.create({
        data: {
          tenant_id: context.tenantId,
          company_id: params.companyId,
          branch_id: params.branchId,
          requisition_id: params.requisitionId,
          status_id: params.statusId,
        },
      }),
    );
  }

  async listar(
    context: UserContext,
    requisitionId: string,
  ): Promise<purchase_requisition_status_history[]> {
    return withTenantScope(this.client, context, (tx) =>
      tx.purchase_requisition_status_history.findMany({
        where: { requisition_id: requisitionId, deleted_at: null },
        orderBy: { created_at: 'asc' },
      }),
    );
  }
}
