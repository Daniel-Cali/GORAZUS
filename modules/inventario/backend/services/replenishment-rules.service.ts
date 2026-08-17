import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { InventoryPrisma, replenishment_rules } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { ReplenishmentRuleRepository } from '../repositories/replenishment-rule.repository';
import { AlmacenRepository } from '../repositories/almacen.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import { StockService } from './stock.service';
import { AlmacenInvalidoException, ProductoInvalidoException } from './movimientos.service';
import { ReplenishmentRule } from '../entities/replenishment-rule.entity';
import type {
  CrearReplenishmentRuleInput,
  ActualizarReplenishmentRuleInput,
} from '../validators/replenishment-rules.schema';

export class ReplenishmentRuleNoEncontradaException extends DomainException {
  constructor(id: string) {
    super('REPLENISHMENT_RULE_NO_ENCONTRADA', `No existe la regla de reposición "${id}".`, 404);
  }
}

export interface EvaluacionReplenishment {
  necesitaReposicion: boolean;
  quantityOnHand: number;
  minQuantity: number;
  maxQuantity: number;
  cantidadSugerida: number;
}

/**
 * WMS Basic (Prompt 1, Foundation Completion) — `inventory.replenishment_rules`,
 * tabla certificada nunca antes consumida por código de aplicación. CRUD +
 * `evaluar`: compara el stock real (`StockService.obtenerDisponible`,
 * mismo servicio que ya usa `AjustesService` — no se duplica la lectura de
 * stock) contra `minQuantity`/`maxQuantity`; si `quantity_on_hand <
 * minQuantity`, sugiere reponer hasta `maxQuantity`. No dispara ninguna
 * orden de compra/recepción automática — solo evalúa y devuelve el
 * resultado (RULE: no se inventa infraestructura de compras nueva).
 */
@Injectable()
export class ReplenishmentRulesService {
  constructor(
    private readonly replenishmentRuleRepository: ReplenishmentRuleRepository,
    private readonly almacenRepository: AlmacenRepository,
    private readonly productoLookupRepository: ProductoLookupRepository,
    private readonly stockService: StockService,
  ) {}

  async crear(
    context: UserContext,
    input: CrearReplenishmentRuleInput,
  ): Promise<replenishment_rules> {
    new ReplenishmentRule(input.warehouseId, input.productId, input.minQuantity, input.maxQuantity);

    const almacen = await this.almacenRepository.findById(context, { id: input.warehouseId });
    if (!almacen) throw new AlmacenInvalidoException(input.warehouseId);

    const productoValido = await this.productoLookupRepository.existeProducto(
      context,
      input.productId,
    );
    if (!productoValido) throw new ProductoInvalidoException(input.productId);

    return this.replenishmentRuleRepository.create(context, {
      tenant_id: context.tenantId,
      warehouse_id: input.warehouseId,
      product_id: input.productId,
      min_quantity: input.minQuantity,
      max_quantity: input.maxQuantity,
    });
  }

  async obtener(context: UserContext, id: string): Promise<replenishment_rules> {
    const regla = await this.replenishmentRuleRepository.findById(context, { id });
    if (!regla) throw new ReplenishmentRuleNoEncontradaException(id);
    return regla;
  }

  async listar(
    context: UserContext,
    filter: InventoryPrisma.replenishment_rulesWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<replenishment_rules>> {
    return this.replenishmentRuleRepository.findMany(context, filter, pagination);
  }

  async actualizar(
    context: UserContext,
    id: string,
    input: ActualizarReplenishmentRuleInput,
  ): Promise<replenishment_rules> {
    const actual = await this.obtener(context, id);
    const minQuantity = input.minQuantity ?? Number(actual.min_quantity);
    const maxQuantity = input.maxQuantity ?? Number(actual.max_quantity);
    if (input.minQuantity !== undefined || input.maxQuantity !== undefined) {
      new ReplenishmentRule(actual.warehouse_id, actual.product_id, minQuantity, maxQuantity);
    }
    return this.replenishmentRuleRepository.update(
      context,
      { id },
      {
        ...(input.minQuantity !== undefined && { min_quantity: input.minQuantity }),
        ...(input.maxQuantity !== undefined && { max_quantity: input.maxQuantity }),
      },
    );
  }

  async evaluar(
    context: UserContext,
    params: { productId: string; warehouseId: string },
  ): Promise<EvaluacionReplenishment | null> {
    const reglas = await this.replenishmentRuleRepository.findMany(
      context,
      { product_id: params.productId, warehouse_id: params.warehouseId },
      { page: 1, pageSize: 1 },
    );
    const regla = reglas.data[0];
    if (!regla) return null;

    const disponible = await this.stockService.obtenerDisponible(context, {
      productId: params.productId,
      warehouseId: params.warehouseId,
    });
    const minQuantity = Number(regla.min_quantity);
    const maxQuantity = Number(regla.max_quantity);
    const necesitaReposicion = disponible.quantityOnHand < minQuantity;

    return {
      necesitaReposicion,
      quantityOnHand: disponible.quantityOnHand,
      minQuantity,
      maxQuantity,
      cantidadSugerida: necesitaReposicion ? maxQuantity - disponible.quantityOnHand : 0,
    };
  }
}
