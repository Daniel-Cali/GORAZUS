import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { taxes } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { ImpuestoRepository } from '../repositories/impuesto.repository';
import { JurisdiccionRepository } from '../repositories/jurisdiccion.repository';
import { Impuesto } from '../entities/impuesto.entity';
import type { CrearImpuestoInput } from '../validators/impuestos.schema';

export class ImpuestoYaExisteException extends DomainException {
  constructor(code: string) {
    super('IMPUESTO_YA_EXISTE', `Ya existe un impuesto con el código "${code}".`, 409);
  }
}

export class ImpuestoNoEncontradoException extends DomainException {
  constructor(id: string) {
    super('IMPUESTO_NO_ENCONTRADO', `No existe el impuesto "${id}".`, 404);
  }
}

export class JurisdiccionInvalidaException extends DomainException {
  constructor(jurisdictionId: string) {
    super('JURISDICCION_INVALIDA', `No existe la jurisdicción fiscal "${jurisdictionId}".`, 400);
  }
}

/**
 * Catálogo de perfiles de impuesto — alcance mínimo de Fase 02: crear/
 * listar/obtener, sin motor de reglas/cálculo (docs/architecture/14-modulo-core.md).
 */
@Injectable()
export class ImpuestosService {
  constructor(
    private readonly impuestoRepository: ImpuestoRepository,
    private readonly jurisdiccionRepository: JurisdiccionRepository,
  ) {}

  async crear(context: UserContext, input: CrearImpuestoInput): Promise<taxes> {
    new Impuesto('pendiente', input.code, input.jurisdictionId, input.taxKind); // valida invariantes antes de tocar la base

    const jurisdiccion = await this.jurisdiccionRepository.findById(context, {
      id: input.jurisdictionId,
    });
    if (!jurisdiccion) throw new JurisdiccionInvalidaException(input.jurisdictionId);

    const existente = await this.impuestoRepository.findByCode(context, input.code);
    if (existente) throw new ImpuestoYaExisteException(input.code);

    return this.impuestoRepository.create(context, {
      tenant_id: context.tenantId,
      code: input.code,
      jurisdiction_id: input.jurisdictionId,
      tax_kind: input.taxKind,
    });
  }

  async listar(
    context: UserContext,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<taxes>> {
    return this.impuestoRepository.findMany(context, {}, pagination);
  }

  async obtener(context: UserContext, id: string): Promise<taxes> {
    const impuesto = await this.impuestoRepository.findById(context, { id });
    if (!impuesto) throw new ImpuestoNoEncontradoException(id);
    return impuesto;
  }
}
