import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CRM, withTenantScope } from '@gorazus/core-database';
import type { CrmPrismaClient } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import { SalesFunnelRepository } from './sales-funnel.repository';

@Injectable()
export class SalesFunnelRepositoryPrisma extends SalesFunnelRepository {
  constructor(@Inject(PRISMA_CRM) private readonly client: CrmPrismaClient) {
    super();
  }

  async existeEtapa(context: UserContext, funnelStageId: string): Promise<boolean> {
    const etapa = await withTenantScope(this.client, context, (tx) =>
      tx.sales_funnel_stages.findFirst({
        where: { id: funnelStageId, deleted_at: null },
        select: { id: true },
      }),
    );
    return etapa !== null;
  }
}
