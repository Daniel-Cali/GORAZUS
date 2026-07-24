import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_INVENTORY, withTenantScope } from '@gorazus/core-database';
import type {
  InventoryPrisma,
  InventoryPrismaClient,
  stock_transfers,
} from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import type { EstadoTransferencia } from '../entities/transferencia.entity';
import {
  TransferenciaRepository,
  type CrearTransferenciaParams,
  type TransferenciaConLineas,
} from './transferencia.repository';

@Injectable()
export class TransferenciaRepositoryPrisma extends TransferenciaRepository {
  constructor(@Inject(PRISMA_INVENTORY) private readonly client: InventoryPrismaClient) {
    super();
  }

  async crear(
    context: UserContext,
    params: CrearTransferenciaParams,
  ): Promise<TransferenciaConLineas> {
    return withTenantScope(this.client, context, (tx) =>
      tx.stock_transfers.create({
        data: {
          tenant_id: context.tenantId,
          company_id: params.companyId,
          branch_id: params.branchId,
          source_warehouse_id: params.sourceWarehouseId,
          destination_warehouse_id: params.destinationWarehouseId,
          document_number: params.documentNumber,
          status: 'draft',
          stock_transfer_lines: {
            create: params.lines.map((linea) => ({
              tenant_id: context.tenantId,
              company_id: params.companyId,
              branch_id: params.branchId,
              product_id: linea.productId,
              quantity: linea.quantity,
            })),
          },
        },
        include: { stock_transfer_lines: true },
      }),
    );
  }

  async obtener(context: UserContext, id: string): Promise<TransferenciaConLineas | null> {
    return withTenantScope(this.client, context, (tx) =>
      tx.stock_transfers.findFirst({
        where: { id, deleted_at: null },
        include: { stock_transfer_lines: true },
      }),
    );
  }

  async listar(
    context: UserContext,
    filter: InventoryPrisma.stock_transfersWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<stock_transfers>> {
    const { page, pageSize } = pagination;
    const where = { ...filter, deleted_at: null };
    return withTenantScope(this.client, context, async (tx) => {
      const [data, total] = await Promise.all([
        tx.stock_transfers.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { created_at: 'desc' },
        }),
        tx.stock_transfers.count({ where }),
      ]);
      return { data, meta: { page, pageSize, total } };
    });
  }

  async actualizarEstado(
    context: UserContext,
    id: string,
    status: EstadoTransferencia,
  ): Promise<stock_transfers> {
    return withTenantScope(this.client, context, (tx) =>
      tx.stock_transfers.update({ where: { id }, data: { status } }),
    );
  }
}
