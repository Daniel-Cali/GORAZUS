import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CRM, withTenantScope } from '@gorazus/core-database';
import type {
  CrmPrisma,
  CrmPrismaClient,
  PaginatedResult,
  PaginationParams,
  opportunities,
} from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import { OpportunityRepository, type CrearOpportunityParams } from './opportunity.repository';

@Injectable()
export class OpportunityRepositoryPrisma extends OpportunityRepository {
  constructor(@Inject(PRISMA_CRM) private readonly client: CrmPrismaClient) {
    super();
  }

  async crear(context: UserContext, params: CrearOpportunityParams): Promise<opportunities> {
    return withTenantScope(this.client, context, async (tx) => {
      const opportunity = await tx.opportunities.create({
        data: {
          tenant_id: context.tenantId,
          company_id: params.companyId,
          branch_id: params.branchId,
          funnel_stage_id: params.funnelStageId,
          lead_id: params.leadId,
          customer_id: params.customerId,
          estimated_amount: params.estimatedAmount,
        },
      });
      if (params.lines.length > 0) {
        await tx.opportunity_lines.createMany({
          data: params.lines.map((line) => ({
            tenant_id: context.tenantId,
            company_id: params.companyId,
            branch_id: params.branchId,
            opportunity_id: opportunity.id,
            product_id: line.productId,
            estimated_quantity: line.estimatedQuantity,
          })),
        });
      }
      return opportunity;
    });
  }

  async findById(context: UserContext, id: string): Promise<opportunities | null> {
    return withTenantScope(this.client, context, (tx) =>
      tx.opportunities.findUnique({ where: { id } }),
    );
  }

  async findMany(
    context: UserContext,
    filter: CrmPrisma.opportunitiesWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<opportunities>> {
    const { page, pageSize } = pagination;
    const where = { ...filter, deleted_at: null };
    return withTenantScope(this.client, context, async (tx) => {
      const [data, total] = await Promise.all([
        tx.opportunities.findMany({ where, skip: (page - 1) * pageSize, take: pageSize }),
        tx.opportunities.count({ where }),
      ]);
      return { data, meta: { page, pageSize, total } };
    });
  }

  async moverDeEtapa(
    context: UserContext,
    id: string,
    nuevoFunnelStageId: string,
  ): Promise<opportunities> {
    return withTenantScope(this.client, context, (tx) =>
      tx.opportunities.update({ where: { id }, data: { funnel_stage_id: nuevoFunnelStageId } }),
    );
  }

  async ganar(
    context: UserContext,
    id: string,
    resultingSalesOrderId: string,
  ): Promise<opportunities> {
    return withTenantScope(this.client, context, (tx) =>
      tx.opportunities.update({
        where: { id },
        data: { status: 'won', resulting_sales_order_id: resultingSalesOrderId },
      }),
    );
  }

  async perder(context: UserContext, id: string, lossReasonId: string): Promise<opportunities> {
    return withTenantScope(this.client, context, (tx) =>
      tx.opportunities.update({
        where: { id },
        data: { status: 'lost', loss_reason_id: lossReasonId },
      }),
    );
  }
}
