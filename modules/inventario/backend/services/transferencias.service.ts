import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { InventoryPrisma, stock_transfers } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import {
  TransferenciaRepository,
  type TransferenciaConLineas,
} from '../repositories/transferencia.repository';
import { TipoMovimientoStockRepository } from '../repositories/tipo-movimiento-stock.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import { AlmacenRepository } from '../repositories/almacen.repository';
import { InventoryLotRepository } from '../repositories/inventory-lot.repository';
import { InventorySerialRepository } from '../repositories/inventory-serial.repository';
import {
  MovimientosService,
  ProductoInvalidoException,
  AlmacenInvalidoException,
} from './movimientos.service';
import {
  Transferencia,
  TRANSICIONES_TRANSFERENCIA,
  type EstadoTransferencia,
} from '../entities/transferencia.entity';
import type { RegistrarMovimientoInput } from '../validators/movimientos.schema';
import type { CrearTransferenciaInput } from '../validators/transferencias.schema';

const SOURCE_MODULE_TRANSFERENCIAS = 'inventario.transferencias';

export class TransferenciaNoEncontradaException extends DomainException {
  constructor(id: string) {
    super('TRANSFERENCIA_NO_ENCONTRADA', `No existe la transferencia "${id}".`, 404);
  }
}

export class TransicionTransferenciaInvalidaException extends DomainException {
  constructor(estadoActual: string, destino: string) {
    super(
      'TRANSICION_TRANSFERENCIA_INVALIDA',
      `No se puede pasar la transferencia de "${estadoActual}" a "${destino}".`,
      409,
    );
  }
}

export class TipoMovimientoTransferenciaNoConfiguradoException extends DomainException {
  constructor(code: string) {
    super(
      'TIPO_MOVIMIENTO_TRANSFERENCIA_NO_CONFIGURADO',
      `No existe el tipo de movimiento "${code}" para este tenant — correr scripts/seed-stock-movement-types.ts primero.`,
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
  constructor(
    motivo: 'no_existe' | 'producto_no_coincide' | 'almacen_no_coincide' | 'sin_disponibilidad',
  ) {
    const mensajes = {
      no_existe: 'El lote indicado no existe.',
      producto_no_coincide: 'El lote indicado no pertenece al producto de esta línea.',
      almacen_no_coincide: 'El lote indicado no está en el almacén de origen.',
      sin_disponibilidad: 'El lote indicado no tiene disponibilidad suficiente para transferir.',
    };
    super('LOTE_INVALIDO', mensajes[motivo], 409);
  }
}

export class SerieInvalidaException extends DomainException {
  constructor(
    motivo: 'no_existe' | 'producto_no_coincide' | 'almacen_no_coincide' | 'no_disponible',
  ) {
    const mensajes = {
      no_existe: 'La serie indicada no existe.',
      producto_no_coincide: 'La serie indicada no pertenece al producto de esta línea.',
      almacen_no_coincide: 'La serie indicada no está en el almacén de origen.',
      no_disponible: 'La serie indicada no está disponible (ya fue emitida).',
    };
    super('SERIE_INVALIDA', mensajes[motivo], 409);
  }
}

/**
 * Transferencias entre almacenes (`inventory.stock_transfers` +
 * `stock_transfer_lines`) — orquesta el motor de movimientos
 * (`MovimientosService`), nunca toca `inventory.stock` directo
 * (`INVENTORY_ARCHITECTURE.md §6`). Flujo de estados: `draft →
 * in_transit` genera `transfer_out` en el almacén origen (lote atómico,
 * una línea o ninguna); `in_transit → received` genera `transfer_in` en
 * el destino; `draft → cancelled` no genera movimientos. Cualquier otra
 * transición es rechazada (`TRANSICIONES_TRANSFERENCIA`).
 */
@Injectable()
export class TransferenciasService {
  constructor(
    private readonly transferenciaRepository: TransferenciaRepository,
    private readonly almacenRepository: AlmacenRepository,
    private readonly productoLookupRepository: ProductoLookupRepository,
    private readonly tipoMovimientoRepository: TipoMovimientoStockRepository,
    private readonly inventoryLotRepository: InventoryLotRepository,
    private readonly inventorySerialRepository: InventorySerialRepository,
    private readonly movimientosService: MovimientosService,
  ) {}

  async crear(
    context: UserContext,
    input: CrearTransferenciaInput,
  ): Promise<TransferenciaConLineas> {
    new Transferencia(
      'pendiente',
      input.sourceWarehouseId,
      input.destinationWarehouseId,
      input.documentNumber,
      input.lines,
    ); // valida invariantes antes de tocar la base

    const origen = await this.almacenRepository.findById(context, { id: input.sourceWarehouseId });
    if (!origen) throw new AlmacenInvalidoException(input.sourceWarehouseId);
    const destino = await this.almacenRepository.findById(context, {
      id: input.destinationWarehouseId,
    });
    if (!destino) throw new AlmacenInvalidoException(input.destinationWarehouseId);

    const lineasResueltas: Array<{
      productId: string;
      quantity: number;
      lotId: string | null;
      serialNumbers: string[] | null;
    }> = [];

    for (const linea of input.lines) {
      const productoValido = await this.productoLookupRepository.existeProducto(
        context,
        linea.productId,
      );
      if (!productoValido) throw new ProductoInvalidoException(linea.productId);

      const control = await this.productoLookupRepository.obtenerControl(context, linea.productId);
      let lotId: string | null = null;
      let serialNumbers: string[] | null = null;

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
        if (lote.warehouse_id !== input.sourceWarehouseId) {
          throw new LoteInvalidoException('almacen_no_coincide');
        }
        if (Number(lote.remaining_quantity) < linea.quantity) {
          throw new LoteInvalidoException('sin_disponibilidad');
        }
        lotId = linea.lotId;
      }

      if (control?.tracksSerial) {
        if (!linea.serialNumbers || linea.serialNumbers.length !== linea.quantity) {
          throw new LoteOSerieRequeridoException(
            `El producto "${linea.productId}" requiere exactamente ${linea.quantity} número(s) de serie (tracks_serial).`,
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
          if (serie.warehouse_id !== input.sourceWarehouseId) {
            throw new SerieInvalidaException('almacen_no_coincide');
          }
          if (serie.status !== 'in_stock') throw new SerieInvalidaException('no_disponible');
        }
        serialNumbers = linea.serialNumbers;
      }

      lineasResueltas.push({
        productId: linea.productId,
        quantity: linea.quantity,
        lotId,
        serialNumbers,
      });
    }

    return this.transferenciaRepository.crear(context, {
      companyId: origen.company_id,
      branchId: origen.branch_id,
      sourceWarehouseId: input.sourceWarehouseId,
      destinationWarehouseId: input.destinationWarehouseId,
      documentNumber: input.documentNumber,
      lines: lineasResueltas,
    });
  }

  async obtener(context: UserContext, id: string): Promise<TransferenciaConLineas> {
    const transferencia = await this.transferenciaRepository.obtener(context, id);
    if (!transferencia) throw new TransferenciaNoEncontradaException(id);
    return transferencia;
  }

  async listar(
    context: UserContext,
    filter: InventoryPrisma.stock_transfersWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<stock_transfers>> {
    return this.transferenciaRepository.listar(context, filter, pagination);
  }

  /**
   * Prompt 1 (Foundation Completion): las líneas con lote/serie no mutan
   * `inventory_lots`/`inventory_serials` acá — una transferencia no
   * consume ni emite, solo relocaliza (eso ocurre recién en `recibir()`,
   * ver comentario ahí). El movimiento OUT ya referencia `lotId`/`serialId`
   * — "every movement references lot/serial when applicable".
   */
  async iniciar(context: UserContext, id: string): Promise<stock_transfers> {
    const transferencia = await this.obtener(context, id);
    this.validarTransicion(transferencia.status, 'in_transit');
    const movementTypeId = await this.resolverTipoPorCodigo(context, 'transfer_out');

    const inputs = await this.construirInputsMovimiento(
      context,
      transferencia.stock_transfer_lines,
      transferencia.source_warehouse_id,
      movementTypeId,
      transferencia.id,
    );
    await this.movimientosService.registrarLote(context, inputs);

    return this.transferenciaRepository.actualizarEstado(context, id, 'in_transit');
  }

  /**
   * Reasigna `warehouse_id` al destino: siempre para series (una unidad
   * completa, sin ambigüedad); para lotes SOLO si se transfirió la
   * cantidad COMPLETA del lote (ver `InventoryLotRepository.moverAlmacen`
   * — transferir una parte de un lote no puede representarse sin partir
   * la fila, fuera de alcance, documentado en el informe final).
   */
  async recibir(context: UserContext, id: string): Promise<stock_transfers> {
    const transferencia = await this.obtener(context, id);
    this.validarTransicion(transferencia.status, 'received');
    const movementTypeId = await this.resolverTipoPorCodigo(context, 'transfer_in');

    for (const linea of transferencia.stock_transfer_lines) {
      if (linea.lot_id) {
        const lote = await this.inventoryLotRepository.obtenerPorId(context, linea.lot_id);
        if (lote && Number(lote.remaining_quantity) === Number(linea.quantity)) {
          await this.inventoryLotRepository.moverAlmacen(context, {
            lotId: linea.lot_id,
            warehouseId: transferencia.destination_warehouse_id,
          });
        }
      }
      const metadata = (linea.metadata ?? {}) as { serialNumbers?: string[] };
      if (metadata.serialNumbers) {
        for (const serialNumber of metadata.serialNumbers) {
          const serie = await this.inventorySerialRepository.obtenerPorNumero(
            context,
            serialNumber,
          );
          if (serie) {
            await this.inventorySerialRepository.moverAlmacen(context, {
              serialId: serie.id,
              warehouseId: transferencia.destination_warehouse_id,
            });
          }
        }
      }
    }

    const inputs = await this.construirInputsMovimiento(
      context,
      transferencia.stock_transfer_lines,
      transferencia.destination_warehouse_id,
      movementTypeId,
      transferencia.id,
    );
    await this.movimientosService.registrarLote(context, inputs);

    return this.transferenciaRepository.actualizarEstado(context, id, 'received');
  }

  /** Una línea con lote genera 1 movimiento; una línea con series genera 1 movimiento POR serie (quantity=1 cada uno, con `serialId` resuelto) — mismo patrón que Recepciones/Salidas. */
  private async construirInputsMovimiento(
    context: UserContext,
    lineas: TransferenciaConLineas['stock_transfer_lines'],
    warehouseId: string,
    movementTypeId: string,
    transferenciaId: string,
  ): Promise<RegistrarMovimientoInput[]> {
    const inputs: RegistrarMovimientoInput[] = [];
    for (const linea of lineas) {
      const metadata = (linea.metadata ?? {}) as { serialNumbers?: string[] };
      if (metadata.serialNumbers && metadata.serialNumbers.length > 0) {
        for (const serialNumber of metadata.serialNumbers) {
          const serie = await this.inventorySerialRepository.obtenerPorNumero(
            context,
            serialNumber,
          );
          inputs.push({
            productId: linea.product_id,
            warehouseId,
            movementTypeId,
            quantity: 1,
            sourceModule: SOURCE_MODULE_TRANSFERENCIAS,
            sourceEntityId: transferenciaId,
            ...(serie && { serialId: serie.id }),
          });
        }
      } else {
        inputs.push({
          productId: linea.product_id,
          warehouseId,
          movementTypeId,
          quantity: Number(linea.quantity),
          sourceModule: SOURCE_MODULE_TRANSFERENCIAS,
          sourceEntityId: transferenciaId,
          ...(linea.lot_id && { lotId: linea.lot_id }),
        });
      }
    }
    return inputs;
  }

  async cancelar(context: UserContext, id: string): Promise<stock_transfers> {
    const transferencia = await this.obtener(context, id);
    this.validarTransicion(transferencia.status, 'cancelled');
    return this.transferenciaRepository.actualizarEstado(context, id, 'cancelled');
  }

  private validarTransicion(estadoActual: string, destino: EstadoTransferencia): void {
    const permitidas = TRANSICIONES_TRANSFERENCIA[estadoActual] ?? [];
    if (!permitidas.includes(destino)) {
      throw new TransicionTransferenciaInvalidaException(estadoActual, destino);
    }
  }

  private async resolverTipoPorCodigo(context: UserContext, code: string): Promise<string> {
    const resultado = await this.tipoMovimientoRepository.findMany(
      context,
      { code } as InventoryPrisma.stock_movement_typesWhereInput,
      { page: 1, pageSize: 1 },
    );
    const tipo = resultado.data[0];
    if (!tipo) throw new TipoMovimientoTransferenciaNoConfiguradoException(code);
    return tipo.id;
  }
}
