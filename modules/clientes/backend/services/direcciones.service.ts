import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { customer_addresses, customers } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { DireccionClienteRepository } from '../repositories/direccion-cliente.repository';
import { ClienteRepository } from '../repositories/cliente.repository';
import { DireccionCliente } from '../entities/direccion-cliente.entity';
import type {
  CrearDireccionInput,
  ActualizarDireccionInput,
} from '../validators/direcciones.schema';

export class ClienteNoEncontradoParaDireccionException extends DomainException {
  constructor(customerId: string) {
    super('CLIENTE_NO_ENCONTRADO', `No existe el cliente "${customerId}".`, 404);
  }
}

export class DireccionNoEncontradaException extends DomainException {
  constructor(id: string) {
    super('DIRECCION_NO_ENCONTRADA', `No existe la dirección "${id}" para este cliente.`, 404);
  }
}

/**
 * CRUD de direcciones de un cliente (`customers.customer_addresses`),
 * Clientes Parte 02 — Customer 360. A lo sumo una dirección `isDefault`
 * por cliente: al marcar una como predeterminada se desmarca cualquier
 * otra (no hay constraint de DB para esto, es una regla de negocio).
 */
@Injectable()
export class DireccionesService {
  constructor(
    private readonly direccionRepository: DireccionClienteRepository,
    private readonly clienteRepository: ClienteRepository,
  ) {}

  /** Devuelve el cliente padre — su `company_id`/`branch_id` son los que hereda cada dirección (multi-company real, nunca el del usuario actor). */
  private async obtenerClienteOFallar(
    context: UserContext,
    customerId: string,
  ): Promise<customers> {
    const cliente = await this.clienteRepository.findById(context, { id: customerId });
    if (!cliente) throw new ClienteNoEncontradoParaDireccionException(customerId);
    return cliente;
  }

  private async desmarcarPredeterminadasActuales(
    context: UserContext,
    customerId: string,
  ): Promise<void> {
    const actuales = await this.direccionRepository.findMany(
      context,
      { customer_id: customerId, is_default: true },
      { page: 1, pageSize: 100 },
    );
    for (const direccion of actuales.data) {
      await this.direccionRepository.update(context, { id: direccion.id }, { is_default: false });
    }
  }

  async crear(
    context: UserContext,
    customerId: string,
    input: CrearDireccionInput,
  ): Promise<customer_addresses> {
    new DireccionCliente(
      'pendiente',
      customerId,
      input.addressType,
      input.line1,
      input.line2 ?? null,
      input.municipalityId ?? null,
      input.postalCode ?? null,
      input.isDefault,
    ); // valida invariantes antes de tocar la base

    const cliente = await this.obtenerClienteOFallar(context, customerId);
    if (input.isDefault) await this.desmarcarPredeterminadasActuales(context, customerId);

    return this.direccionRepository.create(context, {
      tenant_id: context.tenantId,
      company_id: cliente.company_id,
      branch_id: cliente.branch_id,
      customer_id: customerId,
      address_type: input.addressType,
      line1: input.line1,
      line2: input.line2 ?? null,
      municipality_id: input.municipalityId ?? null,
      postal_code: input.postalCode ?? null,
      is_default: input.isDefault,
    });
  }

  async listar(
    context: UserContext,
    customerId: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<customer_addresses>> {
    return this.direccionRepository.findMany(context, { customer_id: customerId }, pagination);
  }

  async obtener(context: UserContext, customerId: string, id: string): Promise<customer_addresses> {
    const direccion = await this.direccionRepository.findById(context, { id });
    if (!direccion || direccion.customer_id !== customerId) {
      throw new DireccionNoEncontradaException(id);
    }
    return direccion;
  }

  async actualizar(
    context: UserContext,
    customerId: string,
    id: string,
    input: ActualizarDireccionInput,
  ): Promise<customer_addresses> {
    await this.obtener(context, customerId, id);
    if (input.isDefault) await this.desmarcarPredeterminadasActuales(context, customerId);

    return this.direccionRepository.update(
      context,
      { id },
      {
        ...(input.addressType !== undefined && { address_type: input.addressType }),
        ...(input.line1 !== undefined && { line1: input.line1 }),
        ...(input.line2 !== undefined && { line2: input.line2 }),
        ...(input.municipalityId !== undefined && { municipality_id: input.municipalityId }),
        ...(input.postalCode !== undefined && { postal_code: input.postalCode }),
        ...(input.isDefault !== undefined && { is_default: input.isDefault }),
      },
    );
  }

  async eliminar(
    context: UserContext,
    customerId: string,
    id: string,
  ): Promise<customer_addresses> {
    await this.obtener(context, customerId, id);
    return this.direccionRepository.softDelete(
      context,
      { id },
      { deleted_at: new Date(), deleted_by: context.userId },
    );
  }
}
