import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { warehouse_zones } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { ZonaAlmacenRepository } from '../repositories/zona-almacen.repository';
import { AlmacenRepository } from '../repositories/almacen.repository';
import { ZonaAlmacen } from '../entities/zona-almacen.entity';
import type {
  CrearZonaAlmacenInput,
  ActualizarZonaAlmacenInput,
} from '../validators/zonas-almacen.schema';

export class ZonaAlmacenNoEncontradaException extends DomainException {
  constructor(id: string) {
    super('ZONA_ALMACEN_NO_ENCONTRADA', `No existe la zona "${id}".`, 404);
  }
}

export class AlmacenInvalidoException extends DomainException {
  constructor(warehouseId: string) {
    super('ALMACEN_INVALIDO', `No existe el almacén "${warehouseId}".`, 400);
  }
}

/** CRUD de zonas de almacén — toda zona pertenece a un almacén ya existente (docs/architecture/19-modulo-inventory.md §2). */
@Injectable()
export class ZonasAlmacenService {
  constructor(
    private readonly zonaAlmacenRepository: ZonaAlmacenRepository,
    private readonly almacenRepository: AlmacenRepository,
  ) {}

  async crear(context: UserContext, input: CrearZonaAlmacenInput): Promise<warehouse_zones> {
    new ZonaAlmacen('pendiente', input.warehouseId, input.name, input.zoneFunction); // valida invariantes antes de tocar la base

    const almacen = await this.almacenRepository.findById(context, { id: input.warehouseId });
    if (!almacen) throw new AlmacenInvalidoException(input.warehouseId);

    return this.zonaAlmacenRepository.create(context, {
      tenant_id: context.tenantId,
      company_id: almacen.company_id,
      branch_id: almacen.branch_id,
      warehouse_id: input.warehouseId,
      name: input.name,
      zone_function: input.zoneFunction,
    });
  }

  async listar(
    context: UserContext,
    warehouseId: string | undefined,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<warehouse_zones>> {
    return this.zonaAlmacenRepository.findMany(
      context,
      warehouseId ? { warehouse_id: warehouseId } : {},
      pagination,
    );
  }

  async obtener(context: UserContext, id: string): Promise<warehouse_zones> {
    const zona = await this.zonaAlmacenRepository.findById(context, { id });
    if (!zona) throw new ZonaAlmacenNoEncontradaException(id);
    return zona;
  }

  async actualizar(
    context: UserContext,
    id: string,
    input: ActualizarZonaAlmacenInput,
  ): Promise<warehouse_zones> {
    await this.obtener(context, id);
    return this.zonaAlmacenRepository.update(
      context,
      { id },
      {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.zoneFunction !== undefined && { zone_function: input.zoneFunction }),
      },
    );
  }
}
