import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { warehouse_locations } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { UbicacionAlmacenRepository } from '../repositories/ubicacion-almacen.repository';
import { ZonaAlmacenRepository } from '../repositories/zona-almacen.repository';
import { UbicacionAlmacen } from '../entities/ubicacion-almacen.entity';
import type {
  CrearUbicacionAlmacenInput,
  ActualizarUbicacionAlmacenInput,
} from '../validators/ubicaciones-almacen.schema';

export class UbicacionAlmacenNoEncontradaException extends DomainException {
  constructor(id: string) {
    super('UBICACION_ALMACEN_NO_ENCONTRADA', `No existe la ubicación "${id}".`, 404);
  }
}

export class ZonaInvalidaException extends DomainException {
  constructor(zoneId: string) {
    super('ZONA_INVALIDA', `No existe la zona "${zoneId}".`, 400);
  }
}

export class UbicacionPadreInvalidaException extends DomainException {
  constructor(parentLocationId: string) {
    super(
      'UBICACION_PADRE_INVALIDA',
      `La ubicación padre "${parentLocationId}" no existe, o no pertenece a la misma zona.`,
      400,
    );
  }
}

/**
 * CRUD de ubicaciones — jerarquía dentro de una zona (Almacén → Zona →
 * Ubicación, auto-referenciada — docs/architecture/19-modulo-inventory.md
 * §2). `parentLocationId`, si viene informado, debe pertenecer a la
 * MISMA zona que la ubicación que se está creando — evita una jerarquía
 * que cruce zonas sin sentido operativo.
 */
@Injectable()
export class UbicacionesAlmacenService {
  constructor(
    private readonly ubicacionAlmacenRepository: UbicacionAlmacenRepository,
    private readonly zonaAlmacenRepository: ZonaAlmacenRepository,
  ) {}

  async crear(
    context: UserContext,
    input: CrearUbicacionAlmacenInput,
  ): Promise<warehouse_locations> {
    new UbicacionAlmacen('pendiente', input.zoneId, input.code, input.parentLocationId ?? null); // valida invariantes antes de tocar la base

    const zona = await this.zonaAlmacenRepository.findById(context, { id: input.zoneId });
    if (!zona) throw new ZonaInvalidaException(input.zoneId);

    if (input.parentLocationId) {
      const padre = await this.ubicacionAlmacenRepository.findById(context, {
        id: input.parentLocationId,
      });
      if (!padre || padre.zone_id !== input.zoneId) {
        throw new UbicacionPadreInvalidaException(input.parentLocationId);
      }
    }

    return this.ubicacionAlmacenRepository.create(context, {
      tenant_id: context.tenantId,
      company_id: zona.company_id,
      branch_id: zona.branch_id,
      zone_id: input.zoneId,
      code: input.code,
      parent_location_id: input.parentLocationId ?? null,
    });
  }

  async listar(
    context: UserContext,
    zoneId: string | undefined,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<warehouse_locations>> {
    return this.ubicacionAlmacenRepository.findMany(
      context,
      zoneId ? { zone_id: zoneId } : {},
      pagination,
    );
  }

  async obtener(context: UserContext, id: string): Promise<warehouse_locations> {
    const ubicacion = await this.ubicacionAlmacenRepository.findById(context, { id });
    if (!ubicacion) throw new UbicacionAlmacenNoEncontradaException(id);
    return ubicacion;
  }

  async actualizar(
    context: UserContext,
    id: string,
    input: ActualizarUbicacionAlmacenInput,
  ): Promise<warehouse_locations> {
    await this.obtener(context, id);
    return this.ubicacionAlmacenRepository.update(
      context,
      { id },
      { ...(input.code !== undefined && { code: input.code }) },
    );
  }
}
