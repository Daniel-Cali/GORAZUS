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
import {
  InventoryLotRepository,
  LoteNoDisponibleError,
} from '../repositories/inventory-lot.repository';
import {
  InventorySerialRepository,
  SerieInvalidaError,
} from '../repositories/inventory-serial.repository';
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

export class LoteOSerieRequeridoException extends DomainException {
  constructor(mensaje: string) {
    super('LOTE_O_SERIE_REQUERIDO', mensaje, 400);
  }
}

export class LoteInvalidoException extends DomainException {
  constructor(motivo: 'no_existe' | 'producto_no_coincide' | 'sin_disponibilidad') {
    const mensajes = {
      no_existe: 'El lote indicado no existe.',
      producto_no_coincide: 'El lote indicado no pertenece al producto de esta línea.',
      sin_disponibilidad: 'El lote indicado no tiene disponibilidad suficiente.',
    };
    super('LOTE_INVALIDO', mensajes[motivo], 409);
  }
}

export class SerieInvalidaException extends DomainException {
  constructor(
    motivo: 'no_existe' | 'producto_no_coincide' | 'ya_emitida' | 'no_emitida' | 'duplicada',
  ) {
    const mensajes = {
      no_existe: 'La serie indicada no existe.',
      producto_no_coincide: 'La serie indicada no pertenece al producto de esta línea.',
      ya_emitida: 'La serie indicada ya fue emitida.',
      no_emitida: 'La serie indicada no está emitida — no se puede devolver a stock.',
      duplicada: 'La serie indicada ya existe.',
    };
    super('SERIE_INVALIDA', mensajes[motivo], 409);
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
    private readonly inventoryLotRepository: InventoryLotRepository,
    private readonly inventorySerialRepository: InventorySerialRepository,
    private readonly stockService: StockService,
    private readonly movimientosService: MovimientosService,
  ) {}

  async crear(context: UserContext, input: CrearAjusteInput): Promise<AjusteConLineas> {
    const almacen = await this.almacenRepository.findById(context, { id: input.warehouseId });
    if (!almacen) throw new AlmacenInvalidoException(input.warehouseId);

    const motivo = await this.motivoAjusteRepository.findById(context, { id: input.reasonId });
    if (!motivo) throw new MotivoAjusteInvalidoException(input.reasonId);

    const lineasResueltas: Array<{
      productId: string;
      previousQuantity: number;
      newQuantity: number;
      lotId: string | null;
      serialNumbers: string[] | null;
    }> = [];
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

      const control = await this.productoLookupRepository.obtenerControl(context, linea.productId);
      let lotId: string | null = null;
      let serialNumbers: string[] | null = null;
      const delta = linea.newQuantity - disponible.quantityOnHand;

      if (control?.tracksLot) {
        if (!linea.lotId) {
          throw new LoteOSerieRequeridoException(
            `El producto "${linea.productId}" requiere seleccionar un lote (tracks_lot).`,
          );
        }
        const lote = await this.inventoryLotRepository.obtenerPorId(context, linea.lotId);
        if (!lote) throw new LoteInvalidoException('no_existe');
        if (lote.product_id !== linea.productId)
          throw new LoteInvalidoException('producto_no_coincide');
        if (delta < 0 && Number(lote.remaining_quantity) < Math.abs(delta)) {
          throw new LoteInvalidoException('sin_disponibilidad');
        }
        lotId = linea.lotId;
      }

      if (control?.tracksSerial && delta !== 0) {
        const cantidadSeries = Math.abs(delta);
        if (!linea.serialNumbers || linea.serialNumbers.length !== cantidadSeries) {
          throw new LoteOSerieRequeridoException(
            `El producto "${linea.productId}" requiere exactamente ${cantidadSeries} número(s) de serie (tracks_serial).`,
          );
        }
        for (const serialNumber of linea.serialNumbers) {
          const serie = await this.inventorySerialRepository.obtenerPorNumero(
            context,
            serialNumber,
          );
          if (!serie) throw new SerieInvalidaException('no_existe');
          if (serie.product_id !== linea.productId)
            throw new SerieInvalidaException('producto_no_coincide');
          if (delta > 0 && serie.status !== 'issued')
            throw new SerieInvalidaException('no_emitida');
          if (delta < 0 && serie.status !== 'in_stock')
            throw new SerieInvalidaException('ya_emitida');
        }
        serialNumbers = linea.serialNumbers;
      }

      lineasResueltas.push({
        productId: linea.productId,
        previousQuantity: disponible.quantityOnHand,
        newQuantity: linea.newQuantity,
        lotId,
        serialNumbers,
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

  /**
   * Prompt 1 (Foundation Completion): línea con lote → 1 movimiento
   * referenciando `lotId`, más `incrementar`/`consumir` según el signo del
   * delta. Línea con series → 1 movimiento POR serie (quantity=1), más
   * `devolverStock`/`emitir` según el signo — mismo patrón que Recepciones/
   * Salidas/Transferencias. La mutación de lote/serie ocurre ANTES de
   * `registrarLote` (necesita `serialId` ya resuelto para el movimiento) —
   * misma limitación de transacción no distribuida ya aceptada
   * (`TECHNICAL_DEBT.md §0`).
   */
  async confirmar(context: UserContext, id: string): Promise<stock_adjustments> {
    const ajuste = await this.obtener(context, id);
    if (ajuste.status !== 'draft') throw new AjusteYaConfirmadoException(id);

    const inputs: RegistrarMovimientoInput[] = [];
    for (const linea of ajuste.stock_adjustment_lines) {
      const delta = Number(linea.new_quantity) - Number(linea.previous_quantity);
      if (delta === 0) continue;

      const code = delta > 0 ? 'adjustment_increase' : 'adjustment_decrease';
      const movementTypeId = await this.resolverTipoPorCodigo(context, code);
      const metadata = (linea.metadata ?? {}) as { serialNumbers?: string[] };

      if (linea.lot_id) {
        try {
          if (delta > 0) {
            await this.inventoryLotRepository.incrementar(context, {
              lotId: linea.lot_id,
              quantity: delta,
            });
          } else {
            await this.inventoryLotRepository.consumir(context, {
              lotId: linea.lot_id,
              productId: linea.product_id,
              quantity: Math.abs(delta),
            });
          }
        } catch (error) {
          if (error instanceof LoteNoDisponibleError) throw new LoteInvalidoException(error.motivo);
          throw error;
        }
        inputs.push({
          productId: linea.product_id,
          warehouseId: ajuste.warehouse_id,
          movementTypeId,
          quantity: Math.abs(delta),
          sourceModule: SOURCE_MODULE_AJUSTES,
          sourceEntityId: ajuste.id,
          lotId: linea.lot_id,
        });
      } else if (metadata.serialNumbers && metadata.serialNumbers.length > 0) {
        for (const serialNumber of metadata.serialNumbers) {
          const serie = await this.inventorySerialRepository.obtenerPorNumero(
            context,
            serialNumber,
          );
          if (!serie) throw new SerieInvalidaException('no_existe');
          try {
            if (delta > 0) {
              await this.inventorySerialRepository.devolverStock(context, {
                serialId: serie.id,
                productId: linea.product_id,
              });
            } else {
              await this.inventorySerialRepository.emitir(context, {
                serialId: serie.id,
                productId: linea.product_id,
              });
            }
          } catch (error) {
            if (error instanceof SerieInvalidaError) throw new SerieInvalidaException(error.motivo);
            throw error;
          }
          inputs.push({
            productId: linea.product_id,
            warehouseId: ajuste.warehouse_id,
            movementTypeId,
            quantity: 1,
            sourceModule: SOURCE_MODULE_AJUSTES,
            sourceEntityId: ajuste.id,
            serialId: serie.id,
          });
        }
      } else {
        inputs.push({
          productId: linea.product_id,
          warehouseId: ajuste.warehouse_id,
          movementTypeId,
          quantity: Math.abs(delta),
          sourceModule: SOURCE_MODULE_AJUSTES,
          sourceEntityId: ajuste.id,
        });
      }
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
