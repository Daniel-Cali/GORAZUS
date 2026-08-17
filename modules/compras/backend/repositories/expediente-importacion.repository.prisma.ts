import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_PURCHASES, withTenantScope } from '@gorazus/core-database';
import type { PurchasesPrisma, PurchasesPrismaClient, imports } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import {
  ExpedienteImportacionRepository,
  type CrearExpedienteImportacionParams,
  type ExpedienteImportacionConGastos,
} from './expediente-importacion.repository';

export class ExpedienteImportacionNoEncontradoParaActualizarError extends Error {}

@Injectable()
export class ExpedienteImportacionRepositoryPrisma extends ExpedienteImportacionRepository {
  constructor(@Inject(PRISMA_PURCHASES) private readonly client: PurchasesPrismaClient) {
    super();
  }

  async crear(context: UserContext, params: CrearExpedienteImportacionParams): Promise<imports> {
    return withTenantScope(this.client, context, (tx) =>
      tx.imports.create({
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

  async obtener(context: UserContext, id: string): Promise<ExpedienteImportacionConGastos | null> {
    return withTenantScope(this.client, context, (tx) =>
      tx.imports.findFirst({
        where: { id, deleted_at: null },
        include: { import_expenses: { where: { deleted_at: null } } },
      }),
    );
  }

  async listar(
    context: UserContext,
    filter: PurchasesPrisma.importsWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<imports>> {
    const { page, pageSize } = pagination;
    const where = { ...filter, deleted_at: null };
    return withTenantScope(this.client, context, async (tx) => {
      const [data, total] = await Promise.all([
        tx.imports.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { created_at: 'desc' },
        }),
        tx.imports.count({ where }),
      ]);
      return { data, meta: { page, pageSize, total } };
    });
  }

  async actualizarEstado(context: UserContext, id: string, statusId: string): Promise<imports> {
    return withTenantScope(this.client, context, async (tx) => {
      const actual = await tx.imports.findFirst({ where: { id, deleted_at: null } });
      if (!actual) throw new ExpedienteImportacionNoEncontradoParaActualizarError(id);
      return tx.imports.update({ where: { id }, data: { status_id: statusId } });
    });
  }

  async anular(context: UserContext, id: string): Promise<imports> {
    return withTenantScope(this.client, context, async (tx) => {
      const actual = await tx.imports.findFirst({ where: { id, deleted_at: null } });
      if (!actual) throw new ExpedienteImportacionNoEncontradoParaActualizarError(id);
      return tx.imports.update({
        where: { id },
        data: { deleted_at: new Date(), deleted_by: context.userId },
      });
    });
  }
}
