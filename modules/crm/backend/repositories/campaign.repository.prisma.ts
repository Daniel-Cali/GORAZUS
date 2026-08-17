import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CRM, withTenantScope } from '@gorazus/core-database';
import type {
  CrmPrisma,
  CrmPrismaClient,
  PaginatedResult,
  PaginationParams,
  campaigns,
} from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import { CampaignRepository, type CrearCampaignParams } from './campaign.repository';

@Injectable()
export class CampaignRepositoryPrisma extends CampaignRepository {
  constructor(@Inject(PRISMA_CRM) private readonly client: CrmPrismaClient) {
    super();
  }

  async crear(context: UserContext, params: CrearCampaignParams): Promise<campaigns> {
    return withTenantScope(this.client, context, (tx) =>
      tx.campaigns.create({
        data: {
          tenant_id: context.tenantId,
          company_id: params.companyId,
          branch_id: params.branchId,
          name: params.name,
          starts_on: params.startsOn,
          ends_on: params.endsOn,
          budget_amount: params.budgetAmount,
        },
      }),
    );
  }

  async findById(context: UserContext, id: string): Promise<campaigns | null> {
    return withTenantScope(this.client, context, (tx) =>
      tx.campaigns.findUnique({ where: { id } }),
    );
  }

  async findMany(
    context: UserContext,
    filter: CrmPrisma.campaignsWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<campaigns>> {
    const { page, pageSize } = pagination;
    const where = { ...filter, deleted_at: null };
    return withTenantScope(this.client, context, async (tx) => {
      const [data, total] = await Promise.all([
        tx.campaigns.findMany({ where, skip: (page - 1) * pageSize, take: pageSize }),
        tx.campaigns.count({ where }),
      ]);
      return { data, meta: { page, pageSize, total } };
    });
  }

  async agregarMiembro(context: UserContext, campaignId: string, leadId: string): Promise<void> {
    await withTenantScope(this.client, context, (tx) =>
      tx.campaign_members.create({
        data: { tenant_id: context.tenantId, campaign_id: campaignId, lead_id: leadId },
      }),
    );
  }
}
