import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { InventoryPrisma, putaway_rules } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { PutawayRuleRepository } from '../repositories/putaway-rule.repository';
import { AlmacenRepository } from '../repositories/almacen.repository';
import { ZonaAlmacenRepository } from '../repositories/zona-almacen.repository';
import { AlmacenInvalidoException } from './movimientos.service';
import { PutawayRule } from '../entities/putaway-rule.entity';
import type {
  CrearPutawayRuleInput,
  ActualizarPutawayRuleInput,
} from '../validators/putaway-rules.schema';

export class PutawayRuleNoEncontradaException extends DomainException {
  constructor(id: string) {
    super('PUTAWAY_RULE_NO_ENCONTRADA', `No existe la regla de putaway "${id}".`, 404);
  }
}

export class ZonaDestinoInvalidaException extends DomainException {
  constructor(zoneId: string, warehouseId: string) {
    super(
      'ZONA_DESTINO_INVALIDA',
      `No existe la zona "${zoneId}", o no pertenece al almacén "${warehouseId}".`,
      400,
    );
  }
}

/**
 * WMS Basic (Prompt 1, Foundation Completion) — `inventory.putaway_rules`,
 * tabla certificada nunca antes consumida por código de aplicación. CRUD +
 * `resolverZonaDestino`: dada una categoría de producto en un almacén,
 * devuelve la zona destino de mayor prioridad (regla específica de
 * categoría gana sobre la regla genérica del almacén, `product_category_id
 * IS NULL`, si ambas matchean).
 */
@Injectable()
export class PutawayRulesService {
  constructor(
    private readonly putawayRuleRepository: PutawayRuleRepository,
    private readonly almacenRepository: AlmacenRepository,
    private readonly zonaAlmacenRepository: ZonaAlmacenRepository,
  ) {}

  async crear(context: UserContext, input: CrearPutawayRuleInput): Promise<putaway_rules> {
    new PutawayRule(input.warehouseId, input.targetZoneId, input.priority, input.productCategoryId);

    const almacen = await this.almacenRepository.findById(context, { id: input.warehouseId });
    if (!almacen) throw new AlmacenInvalidoException(input.warehouseId);

    const zona = await this.zonaAlmacenRepository.findById(context, { id: input.targetZoneId });
    if (!zona || zona.warehouse_id !== input.warehouseId) {
      throw new ZonaDestinoInvalidaException(input.targetZoneId, input.warehouseId);
    }

    return this.putawayRuleRepository.create(context, {
      tenant_id: context.tenantId,
      warehouse_id: input.warehouseId,
      target_zone_id: input.targetZoneId,
      priority: input.priority,
      product_category_id: input.productCategoryId ?? null,
    });
  }

  async obtener(context: UserContext, id: string): Promise<putaway_rules> {
    const regla = await this.putawayRuleRepository.findById(context, { id });
    if (!regla) throw new PutawayRuleNoEncontradaException(id);
    return regla;
  }

  async listar(
    context: UserContext,
    filter: InventoryPrisma.putaway_rulesWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<putaway_rules>> {
    return this.putawayRuleRepository.findMany(context, filter, pagination);
  }

  async actualizar(
    context: UserContext,
    id: string,
    input: ActualizarPutawayRuleInput,
  ): Promise<putaway_rules> {
    const actual = await this.obtener(context, id);
    if (input.targetZoneId !== undefined) {
      const zona = await this.zonaAlmacenRepository.findById(context, { id: input.targetZoneId });
      if (!zona || zona.warehouse_id !== actual.warehouse_id) {
        throw new ZonaDestinoInvalidaException(input.targetZoneId, actual.warehouse_id);
      }
    }
    return this.putawayRuleRepository.update(
      context,
      { id },
      {
        ...(input.targetZoneId !== undefined && { target_zone_id: input.targetZoneId }),
        ...(input.priority !== undefined && { priority: input.priority }),
        ...(input.productCategoryId !== undefined && {
          product_category_id: input.productCategoryId,
        }),
      },
    );
  }

  /** Regla específica de categoría (mayor prioridad primero) gana sobre la regla genérica del almacén. `null` si no hay ninguna regla configurada. */
  async resolverZonaDestino(
    context: UserContext,
    params: { warehouseId: string; productCategoryId?: string },
  ): Promise<string | null> {
    if (params.productCategoryId) {
      const especificas = await this.putawayRuleRepository.findMany(
        context,
        { warehouse_id: params.warehouseId, product_category_id: params.productCategoryId },
        { page: 1, pageSize: 1 },
      );
      if (especificas.data[0]) return especificas.data[0].target_zone_id;
    }

    const genericas = await this.putawayRuleRepository.findMany(
      context,
      { warehouse_id: params.warehouseId, product_category_id: null },
      { page: 1, pageSize: 100 },
    );
    if (genericas.data.length === 0) return null;
    const mejor = genericas.data.reduce((a, b) => (b.priority > a.priority ? b : a));
    return mejor.target_zone_id;
  }
}
