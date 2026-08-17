import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CRM, withTenantScope } from '@gorazus/core-database';
import type { CrmPrismaClient, leads } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import { LeadRepository } from './lead.repository';

@Injectable()
export class LeadRepositoryPrisma extends LeadRepository {
  constructor(@Inject(PRISMA_CRM) client: CrmPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.leads.findUnique(args),
      findMany: (args) => tx.leads.findMany(args),
      count: (args) => tx.leads.count(args),
      create: (args) => tx.leads.create(args),
      update: (args) => tx.leads.update(args),
    }));
  }

  async cambiarEstado(context: UserContext, leadId: string, nuevoStatusId: string): Promise<leads> {
    return withTenantScope(this.client, context, async (tx) => {
      const lead = await tx.leads.update({
        where: { id: leadId },
        data: { status_id: nuevoStatusId },
      });
      await tx.lead_status_history.create({
        data: {
          tenant_id: context.tenantId,
          company_id: lead.company_id,
          branch_id: lead.branch_id,
          lead_id: leadId,
          status_id: nuevoStatusId,
        },
      });
      return lead;
    });
  }
}
