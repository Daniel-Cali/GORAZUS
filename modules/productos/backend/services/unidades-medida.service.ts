import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { units_of_measure } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { UnidadMedidaRepository } from '../repositories/unidad-medida.repository';
import { EmpresaLookupRepository } from '../repositories/empresa-lookup.repository';
import { UnidadMedida } from '../entities/unidad-medida.entity';
import type {
  CrearUnidadMedidaInput,
  ActualizarUnidadMedidaInput,
} from '../validators/unidades-medida.schema';

export class UnidadMedidaNoEncontradaException extends DomainException {
  constructor(id: string) {
    super('UNIDAD_MEDIDA_NO_ENCONTRADA', `No existe la unidad de medida "${id}".`, 404);
  }
}

export class EmpresaInvalidaException extends DomainException {
  constructor(companyId: string) {
    super('EMPRESA_INVALIDA', `No existe la empresa "${companyId}".`, 400);
  }
}

/** CRUD de unidades de medida (docs/architecture/18-modulo-products.md §1) — prerequisito de `Producto` (`base_unit_id` es `NOT NULL`). */
@Injectable()
export class UnidadesMedidaService {
  constructor(
    private readonly unidadMedidaRepository: UnidadMedidaRepository,
    private readonly empresaLookupRepository: EmpresaLookupRepository,
  ) {}

  async crear(context: UserContext, input: CrearUnidadMedidaInput): Promise<units_of_measure> {
    new UnidadMedida('pendiente', input.code); // valida invariantes antes de tocar la base

    const empresaValida = await this.empresaLookupRepository.existeEmpresa(
      context,
      input.companyId,
    );
    if (!empresaValida) throw new EmpresaInvalidaException(input.companyId);

    return this.unidadMedidaRepository.create(context, {
      tenant_id: context.tenantId,
      company_id: input.companyId,
      branch_id: context.branchId,
      code: input.code,
    });
  }

  async listar(
    context: UserContext,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<units_of_measure>> {
    return this.unidadMedidaRepository.findMany(context, {}, pagination);
  }

  async obtener(context: UserContext, id: string): Promise<units_of_measure> {
    const unidad = await this.unidadMedidaRepository.findById(context, { id });
    if (!unidad) throw new UnidadMedidaNoEncontradaException(id);
    return unidad;
  }

  async actualizar(
    context: UserContext,
    id: string,
    input: ActualizarUnidadMedidaInput,
  ): Promise<units_of_measure> {
    await this.obtener(context, id);
    return this.unidadMedidaRepository.update(
      context,
      { id },
      { ...(input.code !== undefined && { code: input.code }) },
    );
  }
}
