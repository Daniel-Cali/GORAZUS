import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { currencies } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { MonedaRepository } from '../repositories/moneda.repository';
import { Moneda } from '../entities/moneda.entity';
import type { CrearMonedaInput } from '../validators/monedas.schema';

export class MonedaYaExisteException extends DomainException {
  constructor(isoCode: string) {
    super('MONEDA_YA_EXISTE', `Ya existe una moneda con el código "${isoCode}".`, 409);
  }
}

export class MonedaNoEncontradaException extends DomainException {
  constructor(isoCode: string) {
    super('MONEDA_NO_ENCONTRADA', `No existe ninguna moneda con el código "${isoCode}".`, 404);
  }
}

/** Catálogo de monedas (docs/architecture/14-modulo-core.md) — sobre el cliente Prisma de `configuration`, no `core`. */
@Injectable()
export class MonedasService {
  constructor(private readonly monedaRepository: MonedaRepository) {}

  async crear(context: UserContext, input: CrearMonedaInput): Promise<currencies> {
    new Moneda('pendiente', input.isoCode, input.decimalPlaces); // valida invariantes antes de tocar la base

    const existente = await this.monedaRepository.findByIsoCode(context, input.isoCode);
    if (existente) throw new MonedaYaExisteException(input.isoCode);

    return this.monedaRepository.create(context, {
      tenant_id: context.tenantId,
      iso_code: input.isoCode,
      symbol: input.symbol,
      decimal_places: input.decimalPlaces,
    });
  }

  async listar(
    context: UserContext,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<currencies>> {
    return this.monedaRepository.findMany(context, {}, pagination);
  }

  async obtenerPorCodigo(context: UserContext, isoCode: string): Promise<currencies> {
    const moneda = await this.monedaRepository.findByIsoCode(context, isoCode);
    if (!moneda) throw new MonedaNoEncontradaException(isoCode);
    return moneda;
  }
}
