import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CRM, withTenantScope } from '@gorazus/core-database';
import type { CrmPrismaClient } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import { LeadSourceRepository } from './lead-source.repository';

@Injectable()
export class LeadSourceRepositoryPrisma extends LeadSourceRepository {
  constructor(@Inject(PRISMA_CRM) private readonly client: CrmPrismaClient) {
    super();
  }

  async existe(context: UserContext, sourceId: string): Promise<boolean> {
    const fuente = await withTenantScope(this.client, context, (tx) =>
      tx.lead_sources.findFirst({
        where: { id: sourceId, deleted_at: null },
        select: { id: true },
      }),
    );
    return fuente !== null;
  }
}
