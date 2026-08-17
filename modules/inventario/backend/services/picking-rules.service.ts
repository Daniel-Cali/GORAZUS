import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { InventoryPrisma, picking_rules } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { PickingRuleRepository } from '../repositories/picking-rule.repository';
import { AlmacenRepository } from '../repositories/almacen.repository';
import { AlmacenInvalidoException } from './movimientos.service';
import { PickingRule } from '../entities/picking-rule.entity';
import type {
  CrearPickingRuleInput,
  ActualizarPickingRuleInput,
} from '../validators/picking-rules.schema';

export class PickingRuleNoEncontradaException extends DomainException {
  constructor(id: string) {
    super('PICKING_RULE_NO_ENCONTRADA', `No existe la regla de picking "${id}".`, 404);
  }
}

/**
 * WMS Basic (Prompt 1, Foundation Completion) — `inventory.picking_rules`,
 * tabla certificada nunca antes consumida por código de aplicación. CRUD +
 * `resolverEstrategia`: la estrategia de picking configurada para un
 * almacén (si hay varias reglas para el mismo almacén, la más reciente
 * gana — no hay columna de prioridad en el schema real, a diferencia de
 * `putaway_rules`).
 */
@Injectable()
export class PickingRulesService {
  constructor(
    private readonly pickingRuleRepository: PickingRuleRepository,
    private readonly almacenRepository: AlmacenRepository,
  ) {}

  async crear(context: UserContext, input: CrearPickingRuleInput): Promise<picking_rules> {
    new PickingRule(input.warehouseId, input.strategy);

    const almacen = await this.almacenRepository.findById(context, { id: input.warehouseId });
    if (!almacen) throw new AlmacenInvalidoException(input.warehouseId);

    return this.pickingRuleRepository.create(context, {
      tenant_id: context.tenantId,
      warehouse_id: input.warehouseId,
      strategy: input.strategy,
    });
  }

  async obtener(context: UserContext, id: string): Promise<picking_rules> {
    const regla = await this.pickingRuleRepository.findById(context, { id });
    if (!regla) throw new PickingRuleNoEncontradaException(id);
    return regla;
  }

  async listar(
    context: UserContext,
    filter: InventoryPrisma.picking_rulesWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<picking_rules>> {
    return this.pickingRuleRepository.findMany(context, filter, pagination);
  }

  async actualizar(
    context: UserContext,
    id: string,
    input: ActualizarPickingRuleInput,
  ): Promise<picking_rules> {
    await this.obtener(context, id);
    if (input.strategy !== undefined) {
      new PickingRule('n/a', input.strategy); // valida que la estrategia sea una de las reconocidas
    }
    return this.pickingRuleRepository.update(
      context,
      { id },
      { ...(input.strategy !== undefined && { strategy: input.strategy }) },
    );
  }

  /** `null` si el almacén no tiene ninguna estrategia configurada — el llamador decide el fallback (ej. FIFO por defecto). */
  async resolverEstrategia(context: UserContext, warehouseId: string): Promise<string | null> {
    const resultado = await this.pickingRuleRepository.findMany(
      context,
      { warehouse_id: warehouseId },
      { page: 1, pageSize: 1 },
    );
    return resultado.data[0]?.strategy ?? null;
  }
}
