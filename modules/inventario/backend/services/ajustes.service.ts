import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { InventoryPrisma, stock_adjustments } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import {
  AjusteStockRepository,
  type AjusteConLineas,
} from '../repositories/ajuste-stock.repository';
import { TipoMovimientoStockRepository } from '../repositories/tipo-movimiento-stock.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import { AlmacenRepository } from '../repositories/almacen.repository';
import { MotivoAjusteRepository } from '../repositories/motivo-ajuste.repository';
import { StockService } from './stock.service';
import {
  MovimientosService,
  ProductoInvalidoException,
  AlmacenInvalidoException,
} from './movimientos.service';
import { AjusteStock } from '../entities/ajuste-stock.entity';
import type { RegistrarMovimientoInput } from '../validators/movimientos.schema';
import type { CrearAjusteInput } from '../validators/ajustes.schema';

const SOURCE_MODULE_AJUSTES = 'inventario.ajustes';

export class AjusteNoEncontradoException extends DomainException {
  constructor(id: string) {
    super('AJUSTE_NO_ENCONTRADO', `No existe el ajuste "${id}".`, 404);
  }
}

export class MotivoAjusteInvalidoException extends DomainException {
  constructor(reasonId: string) {
    super('MOTIVO_AJUSTE_INVALIDO', `No existe el motivo de ajuste "${reasonId}".`, 400);
  }
}

export class AjusteYaConfirmadoException extends DomainException {
  constructor(id: string) {
    super(
      'AJUSTE_YA_CONFIRMADO',
      `El ajuste "${id}" ya fue confirmado — no se puede confirmar dos veces.`,
      409,
    );
  }
}

export class TipoMovimientoAjusteNoConfiguradoException extends DomainException {
  constructor(code: string) {
    super(
      'TIPO_MOVIMIENTO_AJUSTE_NO_CONFIGURADO',
      `No existe el tipo de movimiento "${code}" para este tenant — correr scripts/seed-stock-movement-types.ts primero.`,
      409,
    );
  }
}

/**
 * Ajustes de inventario (`inventory.stock_adjustments` +
 * `stock_adjustment_lines`) — corrige `stock` a un valor conocido y deja
 * registro de por qué (`INVENTORY_ADJUSTMENTS_REPORT.md §2`). `crear`
 * resuelve `previousQuantity` del stock real al momento de crear el
 * ajuste (no lo pide el llamador — evita que quede desincronizado del
 * saldo real entre que se arma el ajuste y se confirma). `confirmar`
 * genera un movimiento por línea con diferencia real (`adjustment_increase`/
 * `adjustment_decrease`) vía `MovimientosService.registrarLote` — mismo
 * motor atómico que Transferencias (Parte 03), nunca toca `stock`
 * directo. Líneas sin diferencia (`newQuantity === previousQuantity`) no
 * generan movimiento — no hay nada que corregir.
 */
@Injectable()
export class AjustesService {
  constructor(
    private readonly ajusteRepository: AjusteStockRepository,
    private readonly almacenRepository: AlmacenRepository,
    private readonly motivoAjusteRepository: MotivoAjusteRepository,
    private readonly productoLookupRepository: ProductoLookupRepository,
    private readonly tipoMovimientoRepository: TipoMovimientoStockRepository,
    private readonly stockService: StockService,
    private readonly movimientosService: MovimientosService,
  ) {}

  async crear(context: UserContext, input: CrearAjusteInput): Promise<AjusteConLineas> {
    const almacen = await this.almacenRepository.findById(context, { id: input.warehouseId });
    if (!almacen) throw new AlmacenInvalidoException(input.warehouseId);

    const motivo = await this.motivoAjusteRepository.findById(context, { id: input.reasonId });
    if (!motivo) throw new MotivoAjusteInvalidoException(input.reasonId);

    const lineasResueltas = [];
    for (const linea of input.lines) {
      const productoValido = await this.productoLookupRepository.existeProducto(
        context,
        linea.productId,
      );
      if (!productoValido) throw new ProductoInvalidoException(linea.productId);

      const disponible = await this.stockService.obtenerDisponible(context, {
        productId: linea.productId,
        warehouseId: input.warehouseId,
      });
      lineasResueltas.push({
        productId: linea.productId,
        previousQuantity: disponible.quantityOnHand,
        newQuantity: linea.newQuantity,
      });
    }

    new AjusteStock('pendiente', input.warehouseId, input.reasonId, lineasResueltas); // valida invariantes antes de tocar la base

    return this.ajusteRepository.crear(context, {
      companyId: almacen.company_id,
      branchId: almacen.branch_id,
      warehouseId: input.warehouseId,
      reasonId: input.reasonId,
      lines: lineasResueltas,
    });
  }

  async obtener(context: UserContext, id: string): Promise<AjusteConLineas> {
    const ajuste = await this.ajusteRepository.obtener(context, id);
    if (!ajuste) throw new AjusteNoEncontradoException(id);
    return ajuste;
  }

  async listar(
    context: UserContext,
    filter: InventoryPrisma.stock_adjustmentsWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<stock_adjustments>> {
    return this.ajusteRepository.listar(context, filter, pagination);
  }

  async confirmar(context: UserContext, id: string): Promise<stock_adjustments> {
    const ajuste = await this.obtener(context, id);
    if (ajuste.status !== 'draft') throw new AjusteYaConfirmadoException(id);

    const inputs: RegistrarMovimientoInput[] = [];
    for (const linea of ajuste.stock_adjustment_lines) {
      const delta = Number(linea.new_quantity) - Number(linea.previous_quantity);
      if (delta === 0) continue;

      const code = delta > 0 ? 'adjustment_increase' : 'adjustment_decrease';
      const movementTypeId = await this.resolverTipoPorCodigo(context, code);
      inputs.push({
        productId: linea.product_id,
        warehouseId: ajuste.warehouse_id,
        movementTypeId,
        quantity: Math.abs(delta),
        sourceModule: SOURCE_MODULE_AJUSTES,
        sourceEntityId: ajuste.id,
      });
    }

    if (inputs.length > 0) {
      await this.movimientosService.registrarLote(context, inputs);
    }

    return this.ajusteRepository.confirmar(context, id);
  }

  private async resolverTipoPorCodigo(context: UserContext, code: string): Promise<string> {
    const resultado = await this.tipoMovimientoRepository.findMany(
      context,
      { code } as InventoryPrisma.stock_movement_typesWhereInput,
      { page: 1, pageSize: 1 },
    );
    const tipo = resultado.data[0];
    if (!tipo) throw new TipoMovimientoAjusteNoConfiguradoException(code);
    return tipo.id;
  }
}
