import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_INVENTORY, withTenantScope } from '@gorazus/core-database';
import type { InventoryPrisma, InventoryPrismaClient, goods_issues } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import {
  GoodsIssueRepository,
  type CrearSalidaInventarioParams,
  type SalidaInventarioConLineas,
} from './goods-issue.repository';

@Injectable()
export class GoodsIssueRepositoryPrisma extends GoodsIssueRepository {
  constructor(@Inject(PRISMA_INVENTORY) private readonly client: InventoryPrismaClient) {
    super();
  }

  async crear(
    context: UserContext,
    params: CrearSalidaInventarioParams,
  ): Promise<SalidaInventarioConLineas> {
    return withTenantScope(this.client, context, (tx) =>
      tx.goods_issues.create({
        data: {
          tenant_id: context.tenantId,
          company_id: params.companyId,
          branch_id: params.branchId,
          warehouse_id: params.warehouseId,
          reason_id: params.reasonId,
          source_module: params.sourceModule,
          source_entity_id: params.sourceEntityId,
          goods_issue_lines: {
            create: params.lines.map((line) => ({
              tenant_id: context.tenantId,
              company_id: params.companyId,
              branch_id: params.branchId,
              product_id: line.productId,
              quantity: line.quantity,
              lot_id: line.lotId,
              metadata: line.serialNumbers ? { serialNumbers: line.serialNumbers } : undefined,
            })),
          },
        },
        include: { goods_issue_lines: { where: { deleted_at: null } } },
      }),
    );
  }

  async obtener(context: UserContext, id: string): Promise<SalidaInventarioConLineas | null> {
    return withTenantScope(this.client, context, (tx) =>
      tx.goods_issues.findFirst({
        where: { id, deleted_at: null },
        include: { goods_issue_lines: { where: { deleted_at: null } } },
      }),
    );
  }

  async listar(
    context: UserContext,
    filter: InventoryPrisma.goods_issuesWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<goods_issues>> {
    return withTenantScope(this.client, context, async (tx) => {
      const where: InventoryPrisma.goods_issuesWhereInput = { ...filter, deleted_at: null };
      const [data, total] = await Promise.all([
        tx.goods_issues.findMany({
          where,
          skip: (pagination.page - 1) * pagination.pageSize,
          take: pagination.pageSize,
          orderBy: { created_at: 'desc' },
        }),
        tx.goods_issues.count({ where }),
      ]);
      return { data, meta: { page: pagination.page, pageSize: pagination.pageSize, total } };
    });
  }

  async anular(context: UserContext, id: string): Promise<goods_issues> {
    return withTenantScope(this.client, context, (tx) =>
      tx.goods_issues.update({ where: { id }, data: { deleted_at: new Date() } }),
    );
  }
}
