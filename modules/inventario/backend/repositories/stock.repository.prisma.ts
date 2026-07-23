import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_INVENTORY, withTenantScope } from '@gorazus/core-database';
import type { InventoryPrisma, InventoryPrismaClient, stock } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import { StockRepository } from './stock.repository';

@Injectable()
export class StockRepositoryPrisma extends StockRepository {
  constructor(@Inject(PRISMA_INVENTORY) private readonly client: InventoryPrismaClient) {
    super();
  }

  async obtener(
    context: UserContext,
    filtro: { productId: string; warehouseId: string; locationId: string | null },
  ): Promise<stock | null> {
    return withTenantScope(this.client, context, (tx) =>
      tx.stock.findFirst({
        where: {
          product_id: filtro.productId,
          warehouse_id: filtro.warehouseId,
          location_id: filtro.locationId,
          deleted_at: null,
        },
      }),
    );
  }

  async listar(
    context: UserContext,
    filter: InventoryPrisma.stockWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<stock>> {
    const { page, pageSize } = pagination;
    const where = { ...filter, deleted_at: null };
    return withTenantScope(this.client, context, async (tx) => {
      const [data, total] = await Promise.all([
        tx.stock.findMany({ where, skip: (page - 1) * pageSize, take: pageSize }),
        tx.stock.count({ where }),
      ]);
      return { data, meta: { page, pageSize, total } };
    });
  }
}
