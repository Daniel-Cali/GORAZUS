import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CASH, withTenantScope } from '@gorazus/core-database';
import type { CashPrisma, CashPrismaClient, cash_movements } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import {
  MovimientoCajaRepository,
  type RegistrarMovimientoCajaParams,
} from './movimiento-caja.repository';

@Injectable()
export class MovimientoCajaRepositoryPrisma extends MovimientoCajaRepository {
  constructor(@Inject(PRISMA_CASH) private readonly client: CashPrismaClient) {
    super();
  }

  async registrar(
    context: UserContext,
    params: RegistrarMovimientoCajaParams,
  ): Promise<cash_movements> {
    return withTenantScope(this.client, context, (tx) =>
      tx.cash_movements.create({
        data: {
          tenant_id: context.tenantId,
          company_id: params.companyId,
          branch_id: params.branchId,
          register_id: params.registerId,
          opening_id: params.openingId,
          movement_type_id: params.movementTypeId,
          amount: params.amount,
          source_module: params.sourceModule,
          source_entity_id: params.sourceEntityId,
          observations: params.observations,
        },
      }),
    );
  }

  async listar(
    context: UserContext,
    filter: CashPrisma.cash_movementsWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<cash_movements>> {
    const { page, pageSize } = pagination;
    const where = { ...filter, deleted_at: null };
    return withTenantScope(this.client, context, async (tx) => {
      const [data, total] = await Promise.all([
        tx.cash_movements.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { created_at: 'desc' },
        }),
        tx.cash_movements.count({ where }),
      ]);
      return { data, meta: { page, pageSize, total } };
    });
  }
}
