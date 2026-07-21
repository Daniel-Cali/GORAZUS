import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { tax_rates } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { TasaImpuestoRepository } from '../repositories/tasa-impuesto.repository';
import { ImpuestoRepository } from '../repositories/impuesto.repository';
import { TasaImpuesto } from '../entities/tasa-impuesto.entity';
import { ImpuestoNoEncontradoException } from './impuestos.service';
import type { CrearTasaImpuestoInput } from '../validators/impuestos.schema';

/** Tasas vigentes de un impuesto — alcance mínimo de Fase 02 (docs/architecture/14-modulo-core.md). */
@Injectable()
export class TasasImpuestoService {
  constructor(
    private readonly tasaRepository: TasaImpuestoRepository,
    private readonly impuestoRepository: ImpuestoRepository,
  ) {}

  async crear(context: UserContext, input: CrearTasaImpuestoInput): Promise<tax_rates> {
    const effectiveFrom = new Date(input.effectiveFrom);
    new TasaImpuesto('pendiente', input.taxId, input.ratePercentage, effectiveFrom); // valida invariantes antes de tocar la base

    const impuesto = await this.impuestoRepository.findById(context, { id: input.taxId });
    if (!impuesto) throw new ImpuestoNoEncontradoException(input.taxId);

    return this.tasaRepository.create(context, {
      tenant_id: context.tenantId,
      tax_id: input.taxId,
      rate_percentage: input.ratePercentage,
      effective_from: effectiveFrom,
      effective_to: input.effectiveTo ? new Date(input.effectiveTo) : undefined,
    });
  }

  async listarPorImpuesto(
    context: UserContext,
    taxId: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<tax_rates>> {
    return this.tasaRepository.findMany(context, { tax_id: taxId }, pagination);
  }
}
