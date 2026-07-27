import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { cost_centers } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { CentroCostoRepository } from '../repositories/centro-costo.repository';
import type { CrearCentroCostoInput } from '../validators/centros-costo.schema';

export class CentroCostoNoEncontradoException extends DomainException {
  constructor(id: string) {
    super('CENTRO_COSTO_NO_ENCONTRADO', `No existe el centro de costo "${id}".`, 404);
  }
}

/** Centros de costo (`accounting.cost_centers`) — sin jerarquía en el schema real, catálogo plano por empresa. */
@Injectable()
export class CentrosCostoService {
  constructor(private readonly centroCostoRepository: CentroCostoRepository) {}

  async crear(context: UserContext, input: CrearCentroCostoInput): Promise<cost_centers> {
    return this.centroCostoRepository.create(context, {
      tenant_id: context.tenantId,
      company_id: input.companyId,
      branch_id: input.branchId ?? null,
      code: input.code,
      name: input.name,
    });
  }

  async obtener(context: UserContext, id: string): Promise<cost_centers> {
    const centro = await this.centroCostoRepository.findById(context, { id });
    if (!centro) throw new CentroCostoNoEncontradoException(id);
    return centro;
  }

  async listar(
    context: UserContext,
    companyId: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<cost_centers>> {
    return this.centroCostoRepository.findMany(context, { company_id: companyId }, pagination);
  }
}
