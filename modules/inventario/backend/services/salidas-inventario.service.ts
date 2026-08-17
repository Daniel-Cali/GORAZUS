import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { InventoryPrisma, goods_issues } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import {
  GoodsIssueRepository,
  type SalidaInventarioConLineas,
} from '../repositories/goods-issue.repository';
import { TipoMovimientoStockRepository } from '../repositories/tipo-movimiento-stock.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import { AlmacenRepository } from '../repositories/almacen.repository';
import { StockInsuficienteError } from '../repositories/movimiento-stock.repository';
import {
  InventoryLotRepository,
  LoteNoDisponibleError,
} from '../repositories/inventory-lot.repository';
import {
  InventorySerialRepository,
  SerieInvalidaError,
  ESTADO_EN_STOCK,
} from '../repositories/inventory-serial.repository';
import { MovimientosService } from './movimientos.service';
import { CosteoService } from './costeo.service';
import { SalidaInventario } from '../entities/salida-inventario.entity';
import { SerieInventario } from '../entities/serie-inventario.entity';
import type { RegistrarMovimientoInput } from '../validators/movimientos.schema';
import type { CrearSalidaInventarioInput } from '../validators/salidas-inventario.schema';

const SOURCE_MODULE_SALIDA_INVENTARIO = 'inventario-salida';
const CODIGO_TIPO_MOVIMIENTO_SALIDA = 'issue';

export type EstadoSalidaInventario = 'borrador' | 'confirmada' | 'cancelada';

export class AlmacenInvalidoException extends DomainException {
  constructor(warehouseId: string) {
    super('ALMACEN_INVALIDO', `No existe el almacén "${warehouseId}".`, 400);
  }
}

export class ProductoInvalidoException extends DomainException {
  constructor(productId: string) {
    super('PRODUCTO_INVALIDO', `No existe el producto "${productId}".`, 400);
  }
}

export class SalidaInventarioNoEncontradaException extends DomainException {
  constructor(id: string) {
    super('SALIDA_INVENTARIO_NO_ENCONTRADA', `No existe la salida de inventario "${id}".`, 404);
  }
}

export class SalidaInventarioInvalidaException extends DomainException {
  constructor(mensaje: string) {
    super('SALIDA_INVENTARIO_INVALIDA', mensaje, 400);
  }
}

export class SalidaYaConfirmadaException extends DomainException {
  constructor(id: string) {
    super(
      'SALIDA_YA_CONFIRMADA',
      `La salida de inventario "${id}" ya fue confirmada — no se puede confirmar dos veces.`,
      409,
    );
  }
}

export class SalidaNoConfirmableException extends DomainException {
  constructor(id: string, motivo: string) {
    super('SALIDA_NO_CONFIRMABLE', `La salida "${id}" no se puede confirmar: ${motivo}`, 409);
  }
}

export class SalidaNoCancelableException extends DomainException {
  constructor(id: string) {
    super(
      'SALIDA_NO_CANCELABLE',
      `La salida "${id}" ya fue confirmada — cancelar requeriría un movimiento de reversión, fuera de alcance de esta subfase.`,
      409,
    );
  }
}

export class StockInsuficienteException extends DomainException {
  constructor(disponible: number, solicitado: number) {
    super(
      'STOCK_INSUFICIENTE',
      `Stock insuficiente: disponible ${disponible}, solicitado ${solicitado}.`,
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
    motivo: 'no_existe' | 'producto_no_coincide' | 'ya_emitida' | 'duplicada' | 'no_emitida',
  ) {
    const mensajes = {
      no_existe: 'La serie indicada no existe.',
      producto_no_coincide: 'La serie indicada no pertenece al producto de esta línea.',
      ya_emitida: 'La serie indicada ya fue emitida — no puede emitirse dos veces.',
      duplicada: 'La serie indicada ya existe.',
      no_emitida: 'La serie indicada no está emitida.',
    };
    super('SERIE_INVALIDA', mensajes[motivo], 409);
  }
}

export class TipoMovimientoSalidaNoConfiguradoException extends DomainException {
  constructor(code: string) {
    super(
      'TIPO_MOVIMIENTO_SALIDA_NO_CONFIGURADO',
      `No existe un tipo de movimiento con código "${code}" — correr el seed de tipos de movimiento.`,
      409,
    );
  }
}

export type SalidaInventarioConEstado = SalidaInventarioConLineas & {
  estado: EstadoSalidaInventario;
};

/**
 * Inventario Parte 05, Subfase 2 (Salidas) — dominio standalone, mismo
 * patrón que `RecepcionesInventarioService`. **No modifica** el checkout de
 * POS (`pos-checkout.service.ts`) ni `VentasService` — ambos ya descuentan
 * stock hoy llamando `MovimientosService.registrarLote` directo, sin pasar
 * por `goods_issues` (verificado en código, no supuesto). Conectar
 * POS/Ventas a este dominio es una decisión de alcance aparte, no tomada
 * en esta subfase — ver Integration risks del informe final.
 */
@Injectable()
export class SalidasInventarioService {
  constructor(
    private readonly salidaRepository: GoodsIssueRepository,
    private readonly almacenRepository: AlmacenRepository,
    private readonly productoLookupRepository: ProductoLookupRepository,
    private readonly tipoMovimientoRepository: TipoMovimientoStockRepository,
    private readonly inventoryLotRepository: InventoryLotRepository,
    private readonly inventorySerialRepository: InventorySerialRepository,
    private readonly movimientosService: MovimientosService,
    private readonly costeoService: CosteoService,
  ) {}

  async crear(
    context: UserContext,
    input: CrearSalidaInventarioInput,
  ): Promise<SalidaInventarioConEstado> {
    try {
      new SalidaInventario(
        input.warehouseId,
        input.lines,
        input.reasonId ?? null,
        input.sourceModule ?? null,
        input.sourceEntityId ?? null,
      ); // valida invariantes antes de tocar la base
    } catch (error) {
      throw new SalidaInventarioInvalidaException(
        error instanceof Error ? error.message : String(error),
      );
    }

    const almacen = await this.almacenRepository.findById(context, { id: input.warehouseId });
    if (!almacen) throw new AlmacenInvalidoException(input.warehouseId);

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
          new SerieInventario(linea.productId, serialNumber); // valida invariantes de identidad
          const serie = await this.inventorySerialRepository.obtenerPorNumero(
            context,
            serialNumber,
          );
          if (!serie) throw new SerieInvalidaException('no_existe');
          if (serie.product_id !== linea.productId)
            throw new SerieInvalidaException('producto_no_coincide');
          if (serie.status !== ESTADO_EN_STOCK) throw new SerieInvalidaException('ya_emitida');
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

    const creada = await this.salidaRepository.crear(context, {
      companyId: almacen.company_id,
      branchId: almacen.branch_id,
      warehouseId: input.warehouseId,
      reasonId: input.reasonId ?? null,
      sourceModule: input.sourceModule ?? null,
      sourceEntityId: input.sourceEntityId ?? null,
      lines: lineasResueltas,
    });

    return { ...creada, estado: 'borrador' };
  }

  async obtener(context: UserContext, id: string): Promise<SalidaInventarioConEstado> {
    const salida = await this.salidaRepository.obtener(context, id);
    if (!salida) throw new SalidaInventarioNoEncontradaException(id);
    const estado = await this.resolverEstado(context, salida);
    return { ...salida, estado };
  }

  async listar(
    context: UserContext,
    filter: InventoryPrisma.goods_issuesWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<goods_issues>> {
    return this.salidaRepository.listar(context, filter, pagination);
  }

  /**
   * RULE 1: nunca se toca `stock` acá — `MovimientosService.registrarLote`
   * es la única puerta (bloqueo de fila real, y `direction: 'out'` ya
   * rechaza con `StockInsuficienteError` si el saldo resultante quedaría
   * por debajo de lo reservado — no se duplica esa validación aquí).
   * RULE 4: el costo de salida lo resuelve `CosteoService.resolverCostoDeSalida`
   * (consume capas FIFO/LIFO o lee el promedio vigente) — no se implementa
   * costeo nuevo. Misma limitación de transacción no distribuida que
   * `RecepcionesInventarioService.confirmar` (`TECHNICAL_DEBT.md §0`).
   */
  async confirmar(
    context: UserContext,
    id: string,
    idempotencyKey?: string,
  ): Promise<SalidaInventarioConEstado> {
    const salida = await this.salidaRepository.obtener(context, id);
    if (!salida) throw new SalidaInventarioNoEncontradaException(id);

    const estadoActual = await this.resolverEstado(context, salida);
    if (estadoActual === 'confirmada') throw new SalidaYaConfirmadaException(id);
    if (estadoActual === 'cancelada') throw new SalidaNoConfirmableException(id, 'está cancelada');

    const movementTypeId = await this.resolverTipoSalida(context);

    // Inventario Parte 05 Subfase 3: mismo criterio que Recepciones — el
    // consumo del lote (decremento atómico) y la emisión de cada serie
    // (transición in_stock -> issued) ocurren ANTES de `registrarLote`
    // porque el movimiento necesita `lotId`/`serialId` ya resueltos. Misma
    // limitación de transacción no distribuida ya aceptada
    // (`TECHNICAL_DEBT.md §0`).
    const inputs: RegistrarMovimientoInput[] = [];
    for (const [i, linea] of salida.goods_issue_lines.entries()) {
      const metadata = (linea.metadata ?? {}) as { serialNumbers?: string[] };

      if (linea.lot_id) {
        try {
          await this.inventoryLotRepository.consumir(context, {
            lotId: linea.lot_id,
            productId: linea.product_id,
            quantity: Number(linea.quantity),
          });
        } catch (error) {
          if (error instanceof LoteNoDisponibleError) throw new LoteInvalidoException(error.motivo);
          throw error;
        }
        inputs.push({
          productId: linea.product_id,
          warehouseId: salida.warehouse_id,
          movementTypeId,
          quantity: Number(linea.quantity),
          sourceModule: SOURCE_MODULE_SALIDA_INVENTARIO,
          sourceEntityId: salida.id,
          lotId: linea.lot_id,
          idempotencyKey: idempotencyKey ? `${idempotencyKey}-L${i}` : undefined,
        });
      } else if (metadata.serialNumbers && metadata.serialNumbers.length > 0) {
        for (const [j, serialNumber] of metadata.serialNumbers.entries()) {
          const serie = await this.inventorySerialRepository.obtenerPorNumero(
            context,
            serialNumber,
          );
          if (!serie) throw new SerieInvalidaException('no_existe');
          try {
            await this.inventorySerialRepository.emitir(context, {
              serialId: serie.id,
              productId: linea.product_id,
            });
          } catch (error) {
            if (error instanceof SerieInvalidaError) throw new SerieInvalidaException(error.motivo);
            throw error;
          }
          inputs.push({
            productId: linea.product_id,
            warehouseId: salida.warehouse_id,
            movementTypeId,
            quantity: 1,
            sourceModule: SOURCE_MODULE_SALIDA_INVENTARIO,
            sourceEntityId: salida.id,
            serialId: serie.id,
            idempotencyKey: idempotencyKey ? `${idempotencyKey}-L${i}-S${j}` : undefined,
          });
        }
      } else {
        inputs.push({
          productId: linea.product_id,
          warehouseId: salida.warehouse_id,
          movementTypeId,
          quantity: Number(linea.quantity),
          sourceModule: SOURCE_MODULE_SALIDA_INVENTARIO,
          sourceEntityId: salida.id,
          idempotencyKey: idempotencyKey ? `${idempotencyKey}-L${i}` : undefined,
        });
      }
    }

    try {
      await this.movimientosService.registrarLote(context, inputs);
    } catch (error) {
      if (error instanceof StockInsuficienteError) {
        throw new StockInsuficienteException(error.disponible, error.solicitado);
      }
      throw error;
    }

    for (const linea of salida.goods_issue_lines) {
      await this.costeoService.resolverCostoDeSalida(context, {
        productId: linea.product_id,
        warehouseId: salida.warehouse_id,
        quantity: Number(linea.quantity),
      });
    }

    return { ...salida, estado: 'confirmada' };
  }

  async cancelar(context: UserContext, id: string): Promise<SalidaInventarioConEstado> {
    const salida = await this.salidaRepository.obtener(context, id);
    if (!salida) throw new SalidaInventarioNoEncontradaException(id);

    const estadoActual = await this.resolverEstado(context, salida);
    if (estadoActual === 'confirmada') throw new SalidaNoCancelableException(id);
    if (estadoActual === 'cancelada') return { ...salida, estado: 'cancelada' };

    const anulada = await this.salidaRepository.anular(context, id);
    return { ...salida, ...anulada, estado: 'cancelada' };
  }

  /** Estado derivado — el schema real no tiene columna de estado (mismo patrón que `goods_receipts`, ISSUE-25). */
  private async resolverEstado(
    context: UserContext,
    salida: SalidaInventarioConLineas,
  ): Promise<EstadoSalidaInventario> {
    if (salida.deleted_at !== null) return 'cancelada';
    const movimientos = await this.movimientosService.listar(
      context,
      { source_module: SOURCE_MODULE_SALIDA_INVENTARIO, source_entity_id: salida.id },
      { page: 1, pageSize: 1 },
    );
    return movimientos.meta.total > 0 ? 'confirmada' : 'borrador';
  }

  private async resolverTipoSalida(context: UserContext): Promise<string> {
    const resultado = await this.tipoMovimientoRepository.findMany(
      context,
      { code: CODIGO_TIPO_MOVIMIENTO_SALIDA } as InventoryPrisma.stock_movement_typesWhereInput,
      { page: 1, pageSize: 1 },
    );
    const tipo = resultado.data[0];
    if (!tipo) {
      throw new TipoMovimientoSalidaNoConfiguradoException(CODIGO_TIPO_MOVIMIENTO_SALIDA);
    }
    return tipo.id;
  }
}
