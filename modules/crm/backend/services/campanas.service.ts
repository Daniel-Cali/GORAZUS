import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { campaigns } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { CampaignRepository } from '../repositories/campaign.repository';
import { LeadRepository } from '../repositories/lead.repository';
import { Campaign } from '../entities/campaign.entity';
import type {
  CrearCampaignInput,
  AgregarMiembroCampaignInput,
} from '../validators/campaigns.schema';

export class CampanaNoEncontradaException extends DomainException {
  constructor(id: string) {
    super('CAMPANA_NO_ENCONTRADA', `No existe la campaña "${id}".`, 404);
  }
}

export class LeadInvalidoException extends DomainException {
  constructor(id: string) {
    super('LEAD_INVALIDO', `No existe el lead "${id}".`, 400);
  }
}

/**
 * Campañas y sus miembros (`CRM_ARCHITECTURE.md §4`). `agregarMiembro`
 * solo admite leads — límite de alcance real, no un descuido (ver
 * `docs/architecture/27-modulo-crm.md §3`): una campaña dirigida a
 * clientes existentes usa los mecanismos de `sales`
 * (`promotions`/`coupons`), no `crm.campaign_members`.
 */
@Injectable()
export class CampanasService {
  constructor(
    private readonly campaignRepository: CampaignRepository,
    private readonly leadRepository: LeadRepository,
  ) {}

  async crear(context: UserContext, input: CrearCampaignInput): Promise<campaigns> {
    new Campaign(
      'pendiente',
      input.companyId,
      input.branchId ?? null,
      input.name,
      input.startsOn ?? null,
      input.endsOn ?? null,
      input.budgetAmount ?? null,
    ); // valida invariantes antes de tocar la base

    return this.campaignRepository.crear(context, {
      companyId: input.companyId,
      branchId: input.branchId ?? null,
      name: input.name,
      startsOn: input.startsOn ?? null,
      endsOn: input.endsOn ?? null,
      budgetAmount: input.budgetAmount ?? null,
    });
  }

  async listar(
    context: UserContext,
    companyId: string | undefined,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<campaigns>> {
    return this.campaignRepository.findMany(
      context,
      { ...(companyId && { company_id: companyId }) },
      pagination,
    );
  }

  async obtener(context: UserContext, id: string): Promise<campaigns> {
    const campana = await this.campaignRepository.findById(context, id);
    if (!campana) throw new CampanaNoEncontradaException(id);
    return campana;
  }

  async agregarMiembro(
    context: UserContext,
    campaignId: string,
    input: AgregarMiembroCampaignInput,
  ): Promise<void> {
    await this.obtener(context, campaignId);
    const lead = await this.leadRepository.findById(context, { id: input.leadId });
    if (!lead) throw new LeadInvalidoException(input.leadId);
    await this.campaignRepository.agregarMiembro(context, campaignId, input.leadId);
  }
}
