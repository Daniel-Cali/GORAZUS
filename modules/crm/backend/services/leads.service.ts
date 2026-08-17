import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { leads } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { ClientesService } from '@gorazus/modules/clientes';
import { LeadRepository } from '../repositories/lead.repository';
import { LeadStatusRepository } from '../repositories/lead-status.repository';
import { LeadSourceRepository } from '../repositories/lead-source.repository';
import { Lead, LEAD_STATUS_CODES } from '../entities/lead.entity';
import type {
  CrearLeadInput,
  CambiarEstadoLeadInput,
  ConvertirLeadInput,
} from '../validators/leads.schema';

export class LeadNoEncontradoException extends DomainException {
  constructor(id: string) {
    super('LEAD_NO_ENCONTRADO', `No existe el lead "${id}".`, 404);
  }
}

export class EstadoInvalidoException extends DomainException {
  constructor(code: string) {
    super('ESTADO_INVALIDO', `No existe el estado de lead con código "${code}".`, 400);
  }
}

export class OrigenInvalidoException extends DomainException {
  constructor(sourceId: string) {
    super('ORIGEN_INVALIDO', `No existe el origen de lead "${sourceId}".`, 400);
  }
}

export class LeadYaConvertidoException extends DomainException {
  constructor(id: string) {
    super('LEAD_YA_CONVERTIDO', `El lead "${id}" ya fue convertido a cliente.`, 400);
  }
}

/**
 * Ciclo de vida de leads (`CRM_ARCHITECTURE.md §4`) — crear, cambiar de
 * estado (con bitácora en `lead_status_history`) y convertir a cliente
 * formal. La conversión nunca escribe directo en `customers.customers`
 * — invoca `ClientesService.crear()` (patrón módulo dueño, ver
 * `docs/architecture/06-comunicacion-entre-modulos.md §4`).
 */
@Injectable()
export class LeadsService {
  constructor(
    private readonly leadRepository: LeadRepository,
    private readonly leadStatusRepository: LeadStatusRepository,
    private readonly leadSourceRepository: LeadSourceRepository,
    private readonly clientesService: ClientesService,
  ) {}

  async crear(context: UserContext, input: CrearLeadInput): Promise<leads> {
    const estadoInicial = await this.leadStatusRepository.buscarPorCodigo(
      context,
      LEAD_STATUS_CODES.NUEVO,
    );
    if (!estadoInicial) throw new EstadoInvalidoException(LEAD_STATUS_CODES.NUEVO);

    if (input.sourceId) {
      const origenValido = await this.leadSourceRepository.existe(context, input.sourceId);
      if (!origenValido) throw new OrigenInvalidoException(input.sourceId);
    }

    new Lead(
      'pendiente',
      input.companyId,
      input.branchId ?? null,
      input.fullName,
      estadoInicial.id,
      input.email ?? null,
      input.phone ?? null,
      input.sourceId ?? null,
    ); // valida invariantes antes de tocar la base

    return this.leadRepository.create(context, {
      tenant_id: context.tenantId,
      company_id: input.companyId,
      branch_id: input.branchId ?? null,
      full_name: input.fullName,
      email: input.email ?? null,
      phone: input.phone ?? null,
      source_id: input.sourceId ?? null,
      status_id: estadoInicial.id,
    });
  }

  async listar(
    context: UserContext,
    companyId: string | undefined,
    query: string | undefined,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<leads>> {
    return this.leadRepository.findMany(
      context,
      {
        ...(companyId && { company_id: companyId }),
        ...(query && {
          OR: [
            { full_name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        }),
      },
      pagination,
    );
  }

  async obtener(context: UserContext, id: string): Promise<leads> {
    const lead = await this.leadRepository.findById(context, { id });
    if (!lead) throw new LeadNoEncontradoException(id);
    return lead;
  }

  async cambiarEstado(
    context: UserContext,
    id: string,
    input: CambiarEstadoLeadInput,
  ): Promise<leads> {
    await this.obtener(context, id);
    const nuevoEstado = await this.leadStatusRepository.buscarPorCodigo(context, input.statusCode);
    if (!nuevoEstado) throw new EstadoInvalidoException(input.statusCode);
    return this.leadRepository.cambiarEstado(context, id, nuevoEstado.id);
  }

  /**
   * Convierte un lead en cliente formal — get-or-create idempotente
   * (mismo patrón que `ClientesService.obtenerOCrearConsumidorFinal`):
   * si el lead ya tiene `converted_customer_id`, no vuelve a crear un
   * cliente ni falla, devuelve el lead tal cual (idempotencia ante un
   * doble click o un reintento de red).
   */
  async convertir(context: UserContext, id: string, input: ConvertirLeadInput): Promise<leads> {
    const lead = await this.obtener(context, id);
    if (lead.converted_customer_id) return lead;

    const cliente = await this.clientesService.crear(context, {
      companyId: lead.company_id,
      branchId: lead.branch_id ?? undefined,
      legalName: input.legalName,
      taxId: input.taxId,
      preferredCurrencyCode: input.preferredCurrencyCode,
    });

    const estadoConvertido = await this.leadStatusRepository.buscarPorCodigo(
      context,
      LEAD_STATUS_CODES.CONVERTIDO,
    );
    if (!estadoConvertido) throw new EstadoInvalidoException(LEAD_STATUS_CODES.CONVERTIDO);

    await this.leadRepository.update(context, { id }, { converted_customer_id: cliente.id });
    return this.leadRepository.cambiarEstado(context, id, estadoConvertido.id);
  }
}
