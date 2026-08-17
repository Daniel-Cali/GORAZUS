import type {
  CrmPrisma,
  PaginatedResult,
  PaginationParams,
  campaigns,
} from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

export interface CrearCampaignParams {
  companyId: string;
  branchId: string | null;
  name: string;
  startsOn: Date | null;
  endsOn: Date | null;
  budgetAmount: number | null;
}

/** Adaptador sobre `crm.campaigns` + `crm.campaign_members`. */
export abstract class CampaignRepository {
  abstract crear(context: UserContext, params: CrearCampaignParams): Promise<campaigns>;

  abstract findById(context: UserContext, id: string): Promise<campaigns | null>;

  abstract findMany(
    context: UserContext,
    filter: CrmPrisma.campaignsWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<campaigns>>;

  abstract agregarMiembro(context: UserContext, campaignId: string, leadId: string): Promise<void>;
}
