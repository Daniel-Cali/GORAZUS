import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_INVENTORY, withTenantScope } from '@gorazus/core-database';
import type {
  InventoryPrisma,
  InventoryPrismaClient,
  physical_counts,
  physical_count_lines,
} from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import {
  ConteoFisicoRepository,
  type CrearConteoParams,
  type ConteoConLineas,
} from './conteo-fisico.repository';

@Injectable()
export class ConteoFisicoRepositoryPrisma extends ConteoFisicoRepository {
  constructor(@Inject(PRISMA_INVENTORY) private readonly client: InventoryPrismaClient) {
    super();
  }

  async crear(context: UserContext, params: CrearConteoParams): Promise<ConteoConLineas> {
    return withTenantScope(this.client, context, (tx) =>
      tx.physical_counts.create({
        data: {
          tenant_id: context.tenantId,
          company_id: params.companyId,
          branch_id: params.branchId,
          warehouse_id: params.warehouseId,
          scheduled_date: params.scheduledDate,
          status: 'planned',
          physical_count_lines: {
            create: params.lines.map((linea) => ({
              tenant_id: context.tenantId,
              company_id: params.companyId,
              branch_id: params.branchId,
              product_id: linea.productId,
              system_quantity: linea.systemQuantity,
              lot_id: linea.lotId,
              serial_id: linea.serialId,
            })),
          },
        },
        include: { physical_count_lines: true },
      }),
    );
  }

  async obtener(context: UserContext, id: string): Promise<ConteoConLineas | null> {
    return withTenantScope(this.client, context, (tx) =>
      tx.physical_counts.findFirst({
        where: { id, deleted_at: null },
        include: { physical_count_lines: true },
      }),
    );
  }

  async listar(
    context: UserContext,
    filter: InventoryPrisma.physical_countsWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<physical_counts>> {
    const { page, pageSize } = pagination;
    const where = { ...filter, deleted_at: null };
    return withTenantScope(this.client, context, async (tx) => {
      const [data, total] = await Promise.all([
        tx.physical_counts.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { created_at: 'desc' },
        }),
        tx.physical_counts.count({ where }),
      ]);
      return { data, meta: { page, pageSize, total } };
    });
  }

  async actualizarEstado(
    context: UserContext,
    id: string,
    status: 'planned' | 'in_progress' | 'completed',
  ): Promise<physical_counts> {
    return withTenantScope(this.client, context, (tx) =>
      tx.physical_counts.update({ where: { id }, data: { status } }),
    );
  }

  async capturarLinea(
    context: UserContext,
    lineaId: string,
    countedQuantity: number,
  ): Promise<physical_count_lines> {
    return withTenantScope(this.client, context, (tx) =>
      tx.physical_count_lines.update({
        where: { id: lineaId },
        data: { counted_quantity: countedQuantity },
      }),
    );
  }
}
