import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CRM, withTenantScope } from '@gorazus/core-database';
import type { CrmPrismaClient } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import { LeadStatusRepository } from './lead-status.repository';

@Injectable()
export class LeadStatusRepositoryPrisma extends LeadStatusRepository {
  constructor(@Inject(PRISMA_CRM) private readonly client: CrmPrismaClient) {
    super();
  }

  async buscarPorCodigo(context: UserContext, code: string): Promise<{ id: string } | null> {
    return withTenantScope(this.client, context, (tx) =>
      tx.lead_status.findFirst({ where: { code, deleted_at: null }, select: { id: true } }),
    );
  }
}
