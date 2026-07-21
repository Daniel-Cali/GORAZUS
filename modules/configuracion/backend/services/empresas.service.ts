import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { companies } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { EmpresaRepository } from '../repositories/empresa.repository';
import { Empresa } from '../entities/empresa.entity';
import type { CrearEmpresaInput, ActualizarEmpresaInput } from '../validators/empresas.schema';

export class EmpresaNoEncontradaException extends DomainException {
  constructor(id: string) {
    super('EMPRESA_NO_ENCONTRADA', `No existe la empresa "${id}".`, 404);
  }
}

/** CRUD de empresas — un solo service, sin caso de uso por método (mismo criterio que `RolesService`). */
@Injectable()
export class EmpresasService {
  constructor(private readonly empresaRepository: EmpresaRepository) {}

  async crear(context: UserContext, input: CrearEmpresaInput): Promise<companies> {
    new Empresa(
      'pendiente',
      input.legalName,
      input.taxId,
      input.functionalCurrencyCode,
      input.fiscalYearStartMonth,
    ); // valida invariantes antes de tocar la base
    return this.empresaRepository.create(context, {
      tenant_id: context.tenantId,
      legal_name: input.legalName,
      trade_name: input.tradeName,
      tax_id: input.taxId,
      tax_regime: input.taxRegime,
      functional_currency_code: input.functionalCurrencyCode,
      fiscal_year_start_month: input.fiscalYearStartMonth,
    });
  }

  async listar(
    context: UserContext,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<companies>> {
    return this.empresaRepository.findMany(context, {}, pagination);
  }

  async obtener(context: UserContext, id: string): Promise<companies> {
    const empresa = await this.empresaRepository.findById(context, { id });
    if (!empresa) throw new EmpresaNoEncontradaException(id);
    return empresa;
  }

  async actualizar(
    context: UserContext,
    id: string,
    input: ActualizarEmpresaInput,
  ): Promise<companies> {
    await this.obtener(context, id);
    return this.empresaRepository.update(
      context,
      { id },
      {
        legal_name: input.legalName,
        trade_name: input.tradeName,
        tax_id: input.taxId,
        tax_regime: input.taxRegime,
        functional_currency_code: input.functionalCurrencyCode,
        fiscal_year_start_month: input.fiscalYearStartMonth,
      },
    );
  }
}
