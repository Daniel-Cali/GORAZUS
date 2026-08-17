import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_INVENTORY, withTenantScope } from '@gorazus/core-database';
import type {
  InventoryPrisma,
  InventoryPrismaClient,
  stock_adjustments,
} from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import {
  AjusteStockRepository,
  type CrearAjusteParams,
  type AjusteConLineas,
} from './ajuste-stock.repository';

@Injectable()
export class AjusteStockRepositoryPrisma extends AjusteStockRepository {
  constructor(@Inject(PRISMA_INVENTORY) private readonly client: InventoryPrismaClient) {
    super();
  }

  async crear(context: UserContext, params: CrearAjusteParams): Promise<AjusteConLineas> {
    return withTenantScope(this.client, context, (tx) =>
      tx.stock_adjustments.create({
        data: {
          tenant_id: context.tenantId,
          company_id: params.companyId,
          branch_id: params.branchId,
          warehouse_id: params.warehouseId,
          reason_id: params.reasonId,
          status: 'draft',
          stock_adjustment_lines: {
            create: params.lines.map((linea) => ({
              tenant_id: context.tenantId,
              company_id: params.companyId,
              branch_id: params.branchId,
              product_id: linea.productId,
              previous_quantity: linea.previousQuantity,
              new_quantity: linea.newQuantity,
              lot_id: linea.lotId,
              metadata: linea.serialNumbers ? { serialNumbers: linea.serialNumbers } : undefined,
            })),
          },
        },
        include: { stock_adjustment_lines: true },
      }),
    );
  }

  async obtener(context: UserContext, id: string): Promise<AjusteConLineas | null> {
    return withTenantScope(this.client, context, (tx) =>
      tx.stock_adjustments.findFirst({
        where: { id, deleted_at: null },
        include: { stock_adjustment_lines: true },
      }),
    );
  }

  async listar(
    context: UserContext,
    filter: InventoryPrisma.stock_adjustmentsWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<stock_adjustments>> {
    const { page, pageSize } = pagination;
    const where = { ...filter, deleted_at: null };
    return withTenantScope(this.client, context, async (tx) => {
      const [data, total] = await Promise.all([
        tx.stock_adjustments.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { created_at: 'desc' },
        }),
        tx.stock_adjustments.count({ where }),
      ]);
      return { data, meta: { page, pageSize, total } };
    });
  }

  async confirmar(context: UserContext, id: string): Promise<stock_adjustments> {
    return withTenantScope(this.client, context, (tx) =>
      tx.stock_adjustments.update({ where: { id }, data: { status: 'confirmed' } }),
    );
  }
}
