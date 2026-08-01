import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_INVENTORY, withTenantScope } from '@gorazus/core-database';
import type { InventoryPrismaClient, average_cost_history } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import {
  AverageCostHistoryRepository,
  type CrearSnapshotPromedioParams,
} from './average-cost-history.repository';

@Injectable()
export class AverageCostHistoryRepositoryPrisma extends AverageCostHistoryRepository {
  constructor(@Inject(PRISMA_INVENTORY) private readonly client: InventoryPrismaClient) {
    super();
  }

  async obtenerUltimoPromedio(
    context: UserContext,
    params: { productId: string; warehouseId: string },
  ): Promise<average_cost_history | null> {
    return withTenantScope(this.client, context, (tx) =>
      tx.average_cost_history.findFirst({
        where: {
          product_id: params.productId,
          warehouse_id: params.warehouseId,
          deleted_at: null,
        },
        orderBy: { created_at: 'desc' },
      }),
    );
  }

  async crearSnapshot(
    context: UserContext,
    params: CrearSnapshotPromedioParams,
  ): Promise<average_cost_history> {
    return withTenantScope(this.client, context, (tx) =>
      tx.average_cost_history.create({
        data: {
          tenant_id: context.tenantId,
          company_id: context.companyId,
          branch_id: context.branchId,
          product_id: params.productId,
          warehouse_id: params.warehouseId,
          new_average_cost: params.newAverageCost,
        },
      }),
    );
  }
}
