import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { system_parameters } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { ParametroRepository } from '../repositories/parametro.repository';
import { Parametro } from '../entities/parametro.entity';
import type { CrearParametroInput } from '../validators/parametros.schema';

export class ParametroYaExisteException extends DomainException {
  constructor(key: string) {
    super('PARAMETRO_YA_EXISTE', `Ya existe un parámetro con la clave "${key}".`, 409);
  }
}

export class ParametroNoEncontradoException extends DomainException {
  constructor(key: string) {
    super('PARAMETRO_NO_ENCONTRADO', `No existe ningún parámetro con la clave "${key}".`, 404);
  }
}

/** Catálogo de parámetros del sistema — se crea uno por clave que un módulo necesite exponer como configurable (docs/architecture/14-modulo-core.md). */
@Injectable()
export class ParametrosService {
  constructor(private readonly parametroRepository: ParametroRepository) {}

  async crear(context: UserContext, input: CrearParametroInput): Promise<system_parameters> {
    new Parametro('pendiente', input.key, input.dataType); // valida invariantes antes de tocar la base

    const existente = await this.parametroRepository.findByKey(context, input.key);
    if (existente) throw new ParametroYaExisteException(input.key);

    return this.parametroRepository.create(context, {
      tenant_id: context.tenantId,
      key: input.key,
      data_type: input.dataType,
      default_value: input.defaultValue,
    });
  }

  async listar(
    context: UserContext,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<system_parameters>> {
    return this.parametroRepository.findMany(context, {}, pagination);
  }

  async obtenerPorClave(context: UserContext, key: string): Promise<system_parameters> {
    const parametro = await this.parametroRepository.findByKey(context, key);
    if (!parametro) throw new ParametroNoEncontradoException(key);
    return parametro;
  }
}
