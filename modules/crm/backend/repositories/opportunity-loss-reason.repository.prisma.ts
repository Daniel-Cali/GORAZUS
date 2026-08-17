import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CRM, withTenantScope } from '@gorazus/core-database';
import type { CrmPrismaClient } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import { OpportunityLossReasonRepository } from './opportunity-loss-reason.repository';

@Injectable()
export class OpportunityLossReasonRepositoryPrisma extends OpportunityLossReasonRepository {
  constructor(@Inject(PRISMA_CRM) private readonly client: CrmPrismaClient) {
    super();
  }

  async existe(context: UserContext, lossReasonId: string): Promise<boolean> {
    const motivo = await withTenantScope(this.client, context, (tx) =>
      tx.opportunity_loss_reasons.findFirst({
        where: { id: lossReasonId, deleted_at: null },
        select: { id: true },
      }),
    );
    return motivo !== null;
  }
}
