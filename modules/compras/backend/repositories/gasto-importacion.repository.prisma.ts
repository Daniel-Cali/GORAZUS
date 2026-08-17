import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_PURCHASES, withTenantScope } from '@gorazus/core-database';
import type { PurchasesPrismaClient, import_expenses } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import {
  GastoImportacionRepository,
  type CrearGastoImportacionParams,
} from './gasto-importacion.repository';

export class GastoImportacionNoEncontradoParaActualizarError extends Error {}

@Injectable()
export class GastoImportacionRepositoryPrisma extends GastoImportacionRepository {
  constructor(@Inject(PRISMA_PURCHASES) private readonly client: PurchasesPrismaClient) {
    super();
  }

  async crear(context: UserContext, params: CrearGastoImportacionParams): Promise<import_expenses> {
    return withTenantScope(this.client, context, (tx) =>
      tx.import_expenses.create({
        data: {
          tenant_id: context.tenantId,
          company_id: params.companyId,
          branch_id: params.branchId,
          import_id: params.importId,
          expense_type: params.expenseType,
          amount: params.amount,
        },
      }),
    );
  }

  async obtener(context: UserContext, id: string): Promise<import_expenses | null> {
    return withTenantScope(this.client, context, (tx) =>
      tx.import_expenses.findFirst({ where: { id, deleted_at: null } }),
    );
  }

  async anular(context: UserContext, id: string): Promise<import_expenses> {
    return withTenantScope(this.client, context, async (tx) => {
      const actual = await tx.import_expenses.findFirst({ where: { id, deleted_at: null } });
      if (!actual) throw new GastoImportacionNoEncontradoParaActualizarError(id);
      return tx.import_expenses.update({
        where: { id },
        data: { deleted_at: new Date(), deleted_by: context.userId },
      });
    });
  }
}
