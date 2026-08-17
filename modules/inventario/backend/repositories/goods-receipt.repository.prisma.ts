import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_INVENTORY, withTenantScope } from '@gorazus/core-database';
import type {
  InventoryPrisma,
  InventoryPrismaClient,
  goods_receipts,
} from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import {
  GoodsReceiptRepository,
  type CrearRecepcionInventarioParams,
  type RecepcionInventarioConLineas,
} from './goods-receipt.repository';

@Injectable()
export class GoodsReceiptRepositoryPrisma extends GoodsReceiptRepository {
  constructor(@Inject(PRISMA_INVENTORY) private readonly client: InventoryPrismaClient) {
    super();
  }

  async crear(
    context: UserContext,
    params: CrearRecepcionInventarioParams,
  ): Promise<RecepcionInventarioConLineas> {
    return withTenantScope(this.client, context, (tx) =>
      tx.goods_receipts.create({
        data: {
          tenant_id: context.tenantId,
          company_id: params.companyId,
          branch_id: params.branchId,
          warehouse_id: params.warehouseId,
          source_module: params.sourceModule,
          source_entity_id: params.sourceEntityId,
          goods_receipt_lines: {
            create: params.lines.map((line) => ({
              tenant_id: context.tenantId,
              company_id: params.companyId,
              branch_id: params.branchId,
              product_id: line.productId,
              quantity: line.quantity,
              unit_cost: line.unitCost,
              lot_id: line.lotId,
              metadata: line.serialNumbers ? { serialNumbers: line.serialNumbers } : undefined,
            })),
          },
        },
        include: { goods_receipt_lines: { where: { deleted_at: null } } },
      }),
    );
  }

  async obtener(context: UserContext, id: string): Promise<RecepcionInventarioConLineas | null> {
    return withTenantScope(this.client, context, (tx) =>
      tx.goods_receipts.findFirst({
        where: { id, deleted_at: null },
        include: { goods_receipt_lines: { where: { deleted_at: null } } },
      }),
    );
  }

  async listar(
    context: UserContext,
    filter: InventoryPrisma.goods_receiptsWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<goods_receipts>> {
    return withTenantScope(this.client, context, async (tx) => {
      const where: InventoryPrisma.goods_receiptsWhereInput = { ...filter, deleted_at: null };
      const [data, total] = await Promise.all([
        tx.goods_receipts.findMany({
          where,
          skip: (pagination.page - 1) * pagination.pageSize,
          take: pagination.pageSize,
          orderBy: { created_at: 'desc' },
        }),
        tx.goods_receipts.count({ where }),
      ]);
      return { data, meta: { page: pagination.page, pageSize: pagination.pageSize, total } };
    });
  }

  async anular(context: UserContext, id: string): Promise<goods_receipts> {
    return withTenantScope(this.client, context, (tx) =>
      tx.goods_receipts.update({ where: { id }, data: { deleted_at: new Date() } }),
    );
  }
}
