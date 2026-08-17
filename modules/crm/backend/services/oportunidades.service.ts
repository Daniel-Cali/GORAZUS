import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { opportunities } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { OpportunityRepository } from '../repositories/opportunity.repository';
import { SalesFunnelRepository } from '../repositories/sales-funnel.repository';
import { OpportunityLossReasonRepository } from '../repositories/opportunity-loss-reason.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import { ClienteLookupRepository } from '../repositories/cliente-lookup.repository';
import { LeadRepository } from '../repositories/lead.repository';
import { Opportunity } from '../entities/opportunity.entity';
import type {
  CrearOpportunityInput,
  MoverDeEtapaInput,
  GanarOpportunityInput,
  PerderOpportunityInput,
} from '../validators/opportunities.schema';

export class OportunidadNoEncontradaException extends DomainException {
  constructor(id: string) {
    super('OPORTUNIDAD_NO_ENCONTRADA', `No existe la oportunidad "${id}".`, 404);
  }
}

export class EtapaInvalidaException extends DomainException {
  constructor(id: string) {
    super('ETAPA_INVALIDA', `No existe la etapa de embudo "${id}".`, 400);
  }
}

export class LeadInvalidoException extends DomainException {
  constructor(id: string) {
    super('LEAD_INVALIDO', `No existe el lead "${id}".`, 400);
  }
}

export class ClienteInvalidoException extends DomainException {
  constructor(id: string) {
    super('CLIENTE_INVALIDO', `No existe el cliente "${id}".`, 400);
  }
}

export class ProductoInvalidoException extends DomainException {
  constructor(id: string) {
    super('PRODUCTO_INVALIDO', `No existe el producto "${id}".`, 400);
  }
}

export class MotivoPerdidaInvalidoException extends DomainException {
  constructor(id: string) {
    super('MOTIVO_PERDIDA_INVALIDO', `No existe el motivo de pérdida "${id}".`, 400);
  }
}

/**
 * Ciclo de vida de oportunidades (`CRM_ARCHITECTURE.md §4`). "Ganar" no
 * invoca a `ventas` directamente — `ventas` todavía no expone un caso de
 * uso de "crear pedido desde oportunidad" (solo facturas directas, ver
 * `CRM_ROADMAP.md` Parte 03) — el llamador provee el
 * `resultingSalesOrderId` ya creado por el flujo normal de `ventas`, y
 * este método solo registra el enlace y marca la oportunidad como
 * ganada (comando síncrono en su forma más simple: la app llama a los
 * dos módulos en secuencia, no hay evento de por medio).
 */
@Injectable()
export class OportunidadesService {
  constructor(
    private readonly opportunityRepository: OpportunityRepository,
    private readonly salesFunnelRepository: SalesFunnelRepository,
    private readonly opportunityLossReasonRepository: OpportunityLossReasonRepository,
    private readonly productoLookupRepository: ProductoLookupRepository,
    private readonly clienteLookupRepository: ClienteLookupRepository,
    private readonly leadRepository: LeadRepository,
  ) {}

  async crear(context: UserContext, input: CrearOpportunityInput): Promise<opportunities> {
    const etapaValida = await this.salesFunnelRepository.existeEtapa(context, input.funnelStageId);
    if (!etapaValida) throw new EtapaInvalidaException(input.funnelStageId);

    if (input.leadId) {
      const lead = await this.leadRepository.findById(context, { id: input.leadId });
      if (!lead) throw new LeadInvalidoException(input.leadId);
    }
    if (input.customerId) {
      const clienteValido = await this.clienteLookupRepository.existeCliente(
        context,
        input.customerId,
      );
      if (!clienteValido) throw new ClienteInvalidoException(input.customerId);
    }
    for (const line of input.lines) {
      const productoValido = await this.productoLookupRepository.existeProducto(
        context,
        line.productId,
      );
      if (!productoValido) throw new ProductoInvalidoException(line.productId);
    }

    new Opportunity(
      'pendiente',
      input.companyId,
      input.branchId ?? null,
      input.funnelStageId,
      input.leadId ?? null,
      input.customerId ?? null,
      input.lines,
    ); // valida invariantes antes de tocar la base

    return this.opportunityRepository.crear(context, {
      companyId: input.companyId,
      branchId: input.branchId ?? null,
      funnelStageId: input.funnelStageId,
      leadId: input.leadId ?? null,
      customerId: input.customerId ?? null,
      estimatedAmount: input.estimatedAmount,
      lines: input.lines,
    });
  }

  async listar(
    context: UserContext,
    companyId: string | undefined,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<opportunities>> {
    return this.opportunityRepository.findMany(
      context,
      { ...(companyId && { company_id: companyId }) },
      pagination,
    );
  }

  async obtener(context: UserContext, id: string): Promise<opportunities> {
    const oportunidad = await this.opportunityRepository.findById(context, id);
    if (!oportunidad) throw new OportunidadNoEncontradaException(id);
    return oportunidad;
  }

  async moverDeEtapa(
    context: UserContext,
    id: string,
    input: MoverDeEtapaInput,
  ): Promise<opportunities> {
    await this.obtener(context, id);
    const etapaValida = await this.salesFunnelRepository.existeEtapa(context, input.funnelStageId);
    if (!etapaValida) throw new EtapaInvalidaException(input.funnelStageId);
    return this.opportunityRepository.moverDeEtapa(context, id, input.funnelStageId);
  }

  async ganar(
    context: UserContext,
    id: string,
    input: GanarOpportunityInput,
  ): Promise<opportunities> {
    await this.obtener(context, id);
    return this.opportunityRepository.ganar(context, id, input.resultingSalesOrderId);
  }

  async perder(
    context: UserContext,
    id: string,
    input: PerderOpportunityInput,
  ): Promise<opportunities> {
    await this.obtener(context, id);
    const motivoValido = await this.opportunityLossReasonRepository.existe(
      context,
      input.lossReasonId,
    );
    if (!motivoValido) throw new MotivoPerdidaInvalidoException(input.lossReasonId);
    return this.opportunityRepository.perder(context, id, input.lossReasonId);
  }
}
