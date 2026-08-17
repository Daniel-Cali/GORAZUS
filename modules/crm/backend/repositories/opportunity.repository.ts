import type {
  CrmPrisma,
  PaginatedResult,
  PaginationParams,
  opportunities,
} from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import type { OpportunityLineInput } from '../entities/opportunity.entity';

export interface CrearOpportunityParams {
  companyId: string;
  branchId: string | null;
  funnelStageId: string;
  leadId: string | null;
  customerId: string | null;
  estimatedAmount: number;
  lines: OpportunityLineInput[];
}

/**
 * Adaptador sobre `crm.opportunities` + `crm.opportunity_lines` — no
 * extiende `BaseRepository` porque encabezado y líneas se crean juntos
 * en una sola transacción (mismo motivo que `FacturaRepository` de
 * `ventas`, aunque acá no hay partición — simple cohesión de agregado).
 */
export abstract class OpportunityRepository {
  abstract crear(context: UserContext, params: CrearOpportunityParams): Promise<opportunities>;

  abstract findById(context: UserContext, id: string): Promise<opportunities | null>;

  abstract findMany(
    context: UserContext,
    filter: CrmPrisma.opportunitiesWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<opportunities>>;

  abstract moverDeEtapa(
    context: UserContext,
    id: string,
    nuevoFunnelStageId: string,
  ): Promise<opportunities>;

  abstract ganar(
    context: UserContext,
    id: string,
    resultingSalesOrderId: string,
  ): Promise<opportunities>;

  abstract perder(context: UserContext, id: string, lossReasonId: string): Promise<opportunities>;
}
