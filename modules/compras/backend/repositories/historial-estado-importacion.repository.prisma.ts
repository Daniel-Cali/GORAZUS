import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_PURCHASES, withTenantScope } from '@gorazus/core-database';
import type { PurchasesPrismaClient, import_status_history } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import {
  HistorialEstadoImportacionRepository,
  type RegistrarTransicionImportacionParams,
} from './historial-estado-importacion.repository';

@Injectable()
export class HistorialEstadoImportacionRepositoryPrisma extends HistorialEstadoImportacionRepository {
  constructor(@Inject(PRISMA_PURCHASES) private readonly client: PurchasesPrismaClient) {
    super();
  }

  async registrar(
    context: UserContext,
    params: RegistrarTransicionImportacionParams,
  ): Promise<import_status_history> {
    return withTenantScope(this.client, context, (tx) =>
      tx.import_status_history.create({
        data: {
          tenant_id: context.tenantId,
          company_id: params.companyId,
          branch_id: params.branchId,
          import_id: params.importId,
          status_id: params.statusId,
        },
      }),
    );
  }

  async listar(context: UserContext, importId: string): Promise<import_status_history[]> {
    return withTenantScope(this.client, context, (tx) =>
      tx.import_status_history.findMany({
        where: { import_id: importId, deleted_at: null },
        orderBy: { created_at: 'asc' },
      }),
    );
  }
}
