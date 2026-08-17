import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { customer_contacts, customers } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { ContactoClienteRepository } from '../repositories/contacto-cliente.repository';
import { ClienteRepository } from '../repositories/cliente.repository';
import { ContactoCliente } from '../entities/contacto-cliente.entity';
import type { CrearContactoInput, ActualizarContactoInput } from '../validators/contactos.schema';

export class ClienteNoEncontradoParaContactoException extends DomainException {
  constructor(customerId: string) {
    super('CLIENTE_NO_ENCONTRADO', `No existe el cliente "${customerId}".`, 404);
  }
}

export class ContactoNoEncontradoException extends DomainException {
  constructor(id: string) {
    super('CONTACTO_NO_ENCONTRADO', `No existe el contacto "${id}" para este cliente.`, 404);
  }
}

/**
 * CRUD de contactos de un cliente (`customers.customer_contacts`),
 * Clientes Parte 02 — Customer 360. A lo sumo un contacto `isPrimary`
 * por cliente: al marcar uno como principal se desmarca cualquier otro
 * (no hay constraint de DB para esto, es una regla de negocio).
 */
@Injectable()
export class ContactosService {
  constructor(
    private readonly contactoRepository: ContactoClienteRepository,
    private readonly clienteRepository: ClienteRepository,
  ) {}

  /** Devuelve el cliente padre — su `company_id`/`branch_id` son los que hereda cada contacto (multi-company real, nunca el del usuario actor). */
  private async obtenerClienteOFallar(
    context: UserContext,
    customerId: string,
  ): Promise<customers> {
    const cliente = await this.clienteRepository.findById(context, { id: customerId });
    if (!cliente) throw new ClienteNoEncontradoParaContactoException(customerId);
    return cliente;
  }

  private async desmarcarPrincipalesActuales(
    context: UserContext,
    customerId: string,
  ): Promise<void> {
    const actuales = await this.contactoRepository.findMany(
      context,
      { customer_id: customerId, is_primary: true },
      { page: 1, pageSize: 100 },
    );
    for (const contacto of actuales.data) {
      await this.contactoRepository.update(context, { id: contacto.id }, { is_primary: false });
    }
  }

  async crear(
    context: UserContext,
    customerId: string,
    input: CrearContactoInput,
  ): Promise<customer_contacts> {
    new ContactoCliente(
      'pendiente',
      customerId,
      input.fullName,
      input.jobTitle ?? null,
      input.email ?? null,
      input.phone ?? null,
      input.isPrimary,
    ); // valida invariantes antes de tocar la base

    const cliente = await this.obtenerClienteOFallar(context, customerId);
    if (input.isPrimary) await this.desmarcarPrincipalesActuales(context, customerId);

    return this.contactoRepository.create(context, {
      tenant_id: context.tenantId,
      company_id: cliente.company_id,
      branch_id: cliente.branch_id,
      customer_id: customerId,
      full_name: input.fullName,
      job_title: input.jobTitle ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      is_primary: input.isPrimary,
    });
  }

  async listar(
    context: UserContext,
    customerId: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<customer_contacts>> {
    return this.contactoRepository.findMany(context, { customer_id: customerId }, pagination);
  }

  async obtener(context: UserContext, customerId: string, id: string): Promise<customer_contacts> {
    const contacto = await this.contactoRepository.findById(context, { id });
    if (!contacto || contacto.customer_id !== customerId) {
      throw new ContactoNoEncontradoException(id);
    }
    return contacto;
  }

  async actualizar(
    context: UserContext,
    customerId: string,
    id: string,
    input: ActualizarContactoInput,
  ): Promise<customer_contacts> {
    await this.obtener(context, customerId, id);
    if (input.isPrimary) await this.desmarcarPrincipalesActuales(context, customerId);

    return this.contactoRepository.update(
      context,
      { id },
      {
        ...(input.fullName !== undefined && { full_name: input.fullName }),
        ...(input.jobTitle !== undefined && { job_title: input.jobTitle }),
        ...(input.email !== undefined && { email: input.email }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.isPrimary !== undefined && { is_primary: input.isPrimary }),
      },
    );
  }

  async eliminar(context: UserContext, customerId: string, id: string): Promise<customer_contacts> {
    await this.obtener(context, customerId, id);
    return this.contactoRepository.softDelete(
      context,
      { id },
      { deleted_at: new Date(), deleted_by: context.userId },
    );
  }
}
