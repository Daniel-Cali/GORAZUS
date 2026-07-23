import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { brands } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { MarcaRepository } from '../repositories/marca.repository';
import { EmpresaLookupRepository } from '../repositories/empresa-lookup.repository';
import { Marca } from '../entities/marca.entity';
import type { CrearMarcaInput, ActualizarMarcaInput } from '../validators/marcas.schema';

export class MarcaNoEncontradaException extends DomainException {
  constructor(id: string) {
    super('MARCA_NO_ENCONTRADA', `No existe la marca "${id}".`, 404);
  }
}

export class EmpresaInvalidaException extends DomainException {
  constructor(companyId: string) {
    super('EMPRESA_INVALIDA', `No existe la empresa "${companyId}".`, 400);
  }
}

/** CRUD de marcas — plana, sin jerarquía (docs/architecture/18-modulo-products.md §3). */
@Injectable()
export class MarcasService {
  constructor(
    private readonly marcaRepository: MarcaRepository,
    private readonly empresaLookupRepository: EmpresaLookupRepository,
  ) {}

  async crear(context: UserContext, input: CrearMarcaInput): Promise<brands> {
    new Marca('pendiente', input.name); // valida invariantes antes de tocar la base

    const empresaValida = await this.empresaLookupRepository.existeEmpresa(
      context,
      input.companyId,
    );
    if (!empresaValida) throw new EmpresaInvalidaException(input.companyId);

    return this.marcaRepository.create(context, {
      tenant_id: context.tenantId,
      company_id: input.companyId,
      branch_id: context.branchId,
      name: input.name,
    });
  }

  async listar(
    context: UserContext,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<brands>> {
    return this.marcaRepository.findMany(context, {}, pagination);
  }

  async obtener(context: UserContext, id: string): Promise<brands> {
    const marca = await this.marcaRepository.findById(context, { id });
    if (!marca) throw new MarcaNoEncontradaException(id);
    return marca;
  }

  async actualizar(context: UserContext, id: string, input: ActualizarMarcaInput): Promise<brands> {
    await this.obtener(context, id);
    return this.marcaRepository.update(
      context,
      { id },
      { ...(input.name !== undefined && { name: input.name }) },
    );
  }
}
