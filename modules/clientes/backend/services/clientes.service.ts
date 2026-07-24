import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { customers } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { ClienteRepository } from '../repositories/cliente.repository';
import { EmpresaSucursalLookupRepository } from '../repositories/empresa-sucursal-lookup.repository';
import { Cliente, TAX_ID_CONSUMIDOR_FINAL } from '../entities/cliente.entity';
import type { CrearClienteInput, ActualizarClienteInput } from '../validators/clientes.schema';

export class ClienteNoEncontradoException extends DomainException {
  constructor(id: string) {
    super('CLIENTE_NO_ENCONTRADO', `No existe el cliente "${id}".`, 404);
  }
}

export class EmpresaInvalidaException extends DomainException {
  constructor(companyId: string) {
    super('EMPRESA_INVALIDA', `No existe la empresa "${companyId}".`, 400);
  }
}

export class SucursalInvalidaException extends DomainException {
  constructor(branchId: string, companyId: string) {
    super(
      'SUCURSAL_INVALIDA',
      `No existe la sucursal "${branchId}", o no pertenece a la empresa "${companyId}".`,
      400,
    );
  }
}

function esViolacionDeUnicidad(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}

/**
 * CRUD mínimo de clientes (`POS_ARCHITECTURE.md §3`) + resolución del
 * cliente sentinela "Consumidor Final", requerido por el checkout del
 * POS cuando no se selecciona un cliente real (`POS_FLOW.md`,
 * "Seleccionar cliente").
 */
@Injectable()
export class ClientesService {
  constructor(
    private readonly clienteRepository: ClienteRepository,
    private readonly empresaSucursalLookupRepository: EmpresaSucursalLookupRepository,
  ) {}

  async crear(context: UserContext, input: CrearClienteInput): Promise<customers> {
    new Cliente(
      'pendiente',
      input.companyId,
      input.branchId ?? null,
      input.legalName,
      input.taxId,
      input.preferredCurrencyCode,
    ); // valida invariantes antes de tocar la base

    const empresaValida = await this.empresaSucursalLookupRepository.existeEmpresa(
      context,
      input.companyId,
    );
    if (!empresaValida) throw new EmpresaInvalidaException(input.companyId);

    if (input.branchId) {
      const sucursalValida = await this.empresaSucursalLookupRepository.existeSucursalDeEmpresa(
        context,
        input.branchId,
        input.companyId,
      );
      if (!sucursalValida) throw new SucursalInvalidaException(input.branchId, input.companyId);
    }

    return this.clienteRepository.create(context, {
      tenant_id: context.tenantId,
      company_id: input.companyId,
      branch_id: input.branchId ?? null,
      legal_name: input.legalName,
      trade_name: input.tradeName ?? null,
      tax_id: input.taxId,
      preferred_currency_code: input.preferredCurrencyCode,
    });
  }

  async listar(
    context: UserContext,
    companyId: string | undefined,
    query: string | undefined,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<customers>> {
    return this.clienteRepository.findMany(
      context,
      {
        ...(companyId && { company_id: companyId }),
        ...(query && {
          OR: [
            { legal_name: { contains: query, mode: 'insensitive' } },
            { tax_id: { contains: query, mode: 'insensitive' } },
          ],
        }),
      },
      pagination,
    );
  }

  async obtener(context: UserContext, id: string): Promise<customers> {
    const cliente = await this.clienteRepository.findById(context, { id });
    if (!cliente) throw new ClienteNoEncontradoException(id);
    return cliente;
  }

  async actualizar(
    context: UserContext,
    id: string,
    input: ActualizarClienteInput,
  ): Promise<customers> {
    await this.obtener(context, id);
    return this.clienteRepository.update(
      context,
      { id },
      {
        ...(input.legalName !== undefined && { legal_name: input.legalName }),
        ...(input.tradeName !== undefined && { trade_name: input.tradeName }),
        ...(input.preferredCurrencyCode !== undefined && {
          preferred_currency_code: input.preferredCurrencyCode,
        }),
      },
    );
  }

  /**
   * Get-or-create idempotente del cliente sentinela por empresa — nunca
   * falla si dos checkouts concurrentes lo piden por primera vez a la
   * vez (retry sobre `uq_customers_customers_taxid`, mismo patrón que
   * `esViolacionDeUnicidad` en `MovimientoStockRepositoryPrisma`, Fase 05
   * Parte 04), evita depender de que alguien corra un script de seed
   * manual antes de poder vender.
   */
  async obtenerOCrearConsumidorFinal(context: UserContext, companyId: string): Promise<customers> {
    const existente = await this.clienteRepository.findMany(
      context,
      { company_id: companyId, tax_id: TAX_ID_CONSUMIDOR_FINAL },
      { page: 1, pageSize: 1 },
    );
    if (existente.data[0]) return existente.data[0];

    try {
      return await this.clienteRepository.create(context, {
        tenant_id: context.tenantId,
        company_id: companyId,
        legal_name: 'Consumidor Final',
        tax_id: TAX_ID_CONSUMIDOR_FINAL,
        preferred_currency_code: 'USD',
      });
    } catch (error) {
      if (!esViolacionDeUnicidad(error)) throw error;
      const reintento = await this.clienteRepository.findMany(
        context,
        { company_id: companyId, tax_id: TAX_ID_CONSUMIDOR_FINAL },
        { page: 1, pageSize: 1 },
      );
      if (!reintento.data[0]) throw error;
      return reintento.data[0];
    }
  }
}
