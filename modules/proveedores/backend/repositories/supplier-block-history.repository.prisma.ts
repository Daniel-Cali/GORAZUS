import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_SUPPLIERS, withTenantScope } from '@gorazus/core-database';
import type { SuppliersPrismaClient, supplier_block_history } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import {
  SupplierBlockHistoryRepository,
  type RegistrarAccionBloqueoParams,
} from './supplier-block-history.repository';

@Injectable()
export class SupplierBlockHistoryRepositoryPrisma extends SupplierBlockHistoryRepository {
  constructor(@Inject(PRISMA_SUPPLIERS) private readonly client: SuppliersPrismaClient) {
    super();
  }

  async registrar(
    context: UserContext,
    params: RegistrarAccionBloqueoParams,
  ): Promise<supplier_block_history> {
    return withTenantScope(this.client, context, (tx) =>
      tx.supplier_block_history.create({
        data: {
          tenant_id: context.tenantId,
          company_id: params.companyId,
          branch_id: params.branchId,
          supplier_id: params.supplierId,
          action: params.action,
          reason: params.reason,
        },
      }),
    );
  }
}
