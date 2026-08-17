import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { InventoryPrisma, goods_receipts } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import {
  GoodsReceiptRepository,
  type RecepcionInventarioConLineas,
} from '../repositories/goods-receipt.repository';
import { TipoMovimientoStockRepository } from '../repositories/tipo-movimiento-stock.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import { AlmacenRepository } from '../repositories/almacen.repository';
import { InventoryLotRepository } from '../repositories/inventory-lot.repository';
import {
  InventorySerialRepository,
  SerieInvalidaError,
} from '../repositories/inventory-serial.repository';
import { MovimientosService } from './movimientos.service';
import { CosteoService } from './costeo.service';
import { RecepcionInventario } from '../entities/recepcion-inventario.entity';
import { LoteInventario } from '../entities/lote-inventario.entity';
import { SerieInventario } from '../entities/serie-inventario.entity';
import type { RegistrarMovimientoInput } from '../validators/movimientos.schema';
import type { CrearRecepcionInventarioInput } from '../validators/recepciones-inventario.schema';

const SOURCE_MODULE_RECEPCION_INVENTARIO = 'inventario-recepcion';
const CODIGO_TIPO_MOVIMIENTO_RECEPCION = 'receipt';

export type EstadoRecepcionInventario = 'borrador' | 'confirmada' | 'cancelada';

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

export class RecepcionInventarioNoEncontradaException extends DomainException {
  constructor(id: string) {
    super(
      'RECEPCION_INVENTARIO_NO_ENCONTRADA',
      `No existe la recepción de inventario "${id}".`,
      404,
    );
  }
}

export class RecepcionInventarioInvalidaException extends DomainException {
  constructor(mensaje: string) {
    super('RECEPCION_INVENTARIO_INVALIDA', mensaje, 400);
  }
}

export class RecepcionYaConfirmadaException extends DomainException {
  constructor(id: string) {
    super(
      'RECEPCION_YA_CONFIRMADA',
      `La recepción de inventario "${id}" ya fue confirmada — no se puede confirmar dos veces.`,
      409,
    );
  }
}

export class RecepcionNoConfirmableException extends DomainException {
  constructor(id: string, motivo: string) {
    super('RECEPCION_NO_CONFIRMABLE', `La recepción "${id}" no se puede confirmar: ${motivo}`, 409);
  }
}

export class RecepcionNoCancelableException extends DomainException {
  constructor(id: string) {
    super(
      'RECEPCION_NO_CANCELABLE',
      `La recepción "${id}" ya fue confirmada — cancelar requeriría un movimiento de reversión, fuera de alcance de esta subfase.`,
      409,
    );
  }
}

export class LoteOSerieRequeridoException extends DomainException {
  constructor(mensaje: string) {
    super('LOTE_O_SERIE_REQUERIDO', mensaje, 400);
  }
}

export class SerieDuplicadaException extends DomainException {
  constructor(serialNumber: string) {
    super(
      'SERIE_DUPLICADA',
      `La serie "${serialNumber}" ya existe — no puede recibirse dos veces.`,
      409,
    );
  }
}

export class TipoMovimientoRecepcionNoConfiguradoException extends DomainException {
  constructor(code: string) {
    super(
      'TIPO_MOVIMIENTO_RECEPCION_NO_CONFIGURADO',
      `No existe un tipo de movimiento con código "${code}" — correr el seed de tipos de movimiento.`,
      409,
    );
  }
}

export type RecepcionInventarioConEstado = RecepcionInventarioConLineas & {
  estado: EstadoRecepcionInventario;
};

/**
 * Inventario Parte 05, Subfase 1 (Recepciones) — cierra el gap real
 * Compras→Inventario: `RecepcionesCompraService` deja `inventory_receipt_id`
 * en null a propósito (sin código de aplicación en Inventario hasta ahora).
 * Orquesta el motor de movimientos y el motor de costeo ya existentes —
 * `inventario.module.ts` documenta que `CosteoService` está "agregado como
 * servicio standalone, sin conexión automática a MovimientosService
 * todavía"; este servicio es el primer punto real que los conecta.
 */
@Injectable()
export class RecepcionesInventarioService {
  constructor(
    private readonly recepcionRepository: GoodsReceiptRepository,
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
    input: CrearRecepcionInventarioInput,
  ): Promise<RecepcionInventarioConEstado> {
    try {
      new RecepcionInventario(
        input.warehouseId,
        input.lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          unitCost: l.unitCost ?? null,
        })),
        input.sourceModule ?? null,
        input.sourceEntityId ?? null,
      ); // valida invariantes antes de tocar la base
    } catch (error) {
      throw new RecepcionInventarioInvalidaException(
        error instanceof Error ? error.message : String(error),
      );
    }

    const almacen = await this.almacenRepository.findById(context, { id: input.warehouseId });
    if (!almacen) throw new AlmacenInvalidoException(input.warehouseId);

    const lineasResueltas: Array<{
      productId: string;
      quantity: number;
      unitCost: number | null;
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
        if (!linea.lotNumber) {
          throw new LoteOSerieRequeridoException(
            `El producto "${linea.productId}" requiere número de lote (tracks_lot).`,
          );
        }
        let lote: LoteInventario;
        try {
          lote = new LoteInventario(
            linea.productId,
            linea.lotNumber,
            linea.quantity,
            linea.expiryDate ?? null,
            linea.manufactureDate ?? null,
            linea.supplierReference ?? null,
          );
        } catch (error) {
          throw new RecepcionInventarioInvalidaException(
            error instanceof Error ? error.message : String(error),
          );
        }
        // quantity: 0 — el borrador solo resuelve la IDENTIDAD del lote (para
        // obtener lotId); la cantidad real se suma recién en confirmar().
        const loteCreado = await this.inventoryLotRepository.crearOIncrementar(context, {
          productId: lote.productId,
          warehouseId: input.warehouseId,
          lotNumber: lote.lotNumber,
          quantity: 0,
          expiryDate: lote.expiryDate,
          manufactureDate: lote.manufactureDate,
          supplierReference: lote.supplierReference,
        });
        lotId = loteCreado.id;
      }

      if (control?.tracksSerial) {
        if (!linea.serialNumbers || linea.serialNumbers.length !== linea.quantity) {
          throw new LoteOSerieRequeridoException(
            `El producto "${linea.productId}" requiere exactamente ${linea.quantity} número(s) de serie (tracks_serial).`,
          );
        }
        for (const serialNumber of linea.serialNumbers) {
          try {
            new SerieInventario(linea.productId, serialNumber); // valida invariantes, no persiste todavía
          } catch (error) {
            throw new RecepcionInventarioInvalidaException(
              error instanceof Error ? error.message : String(error),
            );
          }
        }
        serialNumbers = linea.serialNumbers;
      }

      lineasResueltas.push({
        productId: linea.productId,
        quantity: linea.quantity,
        unitCost: linea.unitCost ?? null,
        lotId,
        serialNumbers,
      });
    }

    const creada = await this.recepcionRepository.crear(context, {
      companyId: almacen.company_id,
      branchId: almacen.branch_id,
      warehouseId: input.warehouseId,
      sourceModule: input.sourceModule ?? null,
      sourceEntityId: input.sourceEntityId ?? null,
      lines: lineasResueltas,
    });

    return { ...creada, estado: 'borrador' };
  }

  async obtener(context: UserContext, id: string): Promise<RecepcionInventarioConEstado> {
    const recepcion = await this.recepcionRepository.obtener(context, id);
    if (!recepcion) throw new RecepcionInventarioNoEncontradaException(id);
    const estado = await this.resolverEstado(context, recepcion);
    return { ...recepcion, estado };
  }

  async listar(
    context: UserContext,
    filter: InventoryPrisma.goods_receiptsWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<goods_receipts>> {
    return this.recepcionRepository.listar(context, filter, pagination);
  }

  /**
   * `registrarLote` es atómico para los movimientos (una sola transacción de
   * `withTenantScope`), pero `CosteoService` usa su propia conexión — no hay
   * transacción distribuida real entre movimiento y costeo. Mismo límite ya
   * aceptado y documentado para el checkout de POS (`TECHNICAL_DEBT.md §0`,
   * "Checkout de POS no es una transacción distribuida real") — no se
   * inventa infraestructura nueva para resolverlo acá. Si el costeo falla
   * después de que los movimientos ya se crearon, la recepción queda
   * "confirmada" (los movimientos existen) con capas de costo incompletas.
   */
  async confirmar(
    context: UserContext,
    id: string,
    idempotencyKey?: string,
  ): Promise<RecepcionInventarioConEstado> {
    const recepcion = await this.recepcionRepository.obtener(context, id);
    if (!recepcion) throw new RecepcionInventarioNoEncontradaException(id);

    const estadoActual = await this.resolverEstado(context, recepcion);
    if (estadoActual === 'confirmada') throw new RecepcionYaConfirmadaException(id);
    if (estadoActual === 'cancelada') {
      throw new RecepcionNoConfirmableException(id, 'está cancelada');
    }

    const movementTypeId = await this.resolverTipoRecepcion(context);

    // Inventario Parte 05 Subfase 3: una línea con lote genera UN movimiento
    // (el lote agrupa cantidad); una línea con series genera UN movimiento
    // POR serie (quantity=1 cada uno, "una serie = una unidad física") — no
    // se puede representar N series en un solo movimiento agregado. El
    // incremento de `remaining_quantity` y la creación de cada
    // `inventory_serials` ocurren ANTES de `registrarLote` porque el
    // movimiento necesita el id ya resuelto (`lot_id`/`serial_id` se graban
    // en el mismo INSERT del movimiento) — misma limitación de transacción
    // no distribuida ya aceptada para costeo (`TECHNICAL_DEBT.md §0`): si
    // `registrarLote` falla después, el lote/serie ya quedó actualizado sin
    // movimiento correspondiente.
    const inputs: RegistrarMovimientoInput[] = [];
    for (const [i, linea] of recepcion.goods_receipt_lines.entries()) {
      const unitCost = linea.unit_cost !== null ? Number(linea.unit_cost) : undefined;
      const metadata = (linea.metadata ?? {}) as { serialNumbers?: string[] };

      if (linea.lot_id) {
        await this.inventoryLotRepository.incrementar(context, {
          lotId: linea.lot_id,
          quantity: Number(linea.quantity),
        });
        inputs.push({
          productId: linea.product_id,
          warehouseId: recepcion.warehouse_id,
          movementTypeId,
          quantity: Number(linea.quantity),
          unitCost,
          sourceModule: SOURCE_MODULE_RECEPCION_INVENTARIO,
          sourceEntityId: recepcion.id,
          lotId: linea.lot_id,
          idempotencyKey: idempotencyKey ? `${idempotencyKey}-L${i}` : undefined,
        });
      } else if (metadata.serialNumbers && metadata.serialNumbers.length > 0) {
        for (const [j, serialNumber] of metadata.serialNumbers.entries()) {
          let serie;
          try {
            serie = await this.inventorySerialRepository.crear(context, {
              productId: linea.product_id,
              warehouseId: recepcion.warehouse_id,
              serialNumber,
              unitCost: linea.unit_cost !== null ? Number(linea.unit_cost) : null,
            });
          } catch (error) {
            if (error instanceof SerieInvalidaError) {
              throw new SerieDuplicadaException(serialNumber);
            }
            throw error;
          }
          inputs.push({
            productId: linea.product_id,
            warehouseId: recepcion.warehouse_id,
            movementTypeId,
            quantity: 1,
            unitCost,
            sourceModule: SOURCE_MODULE_RECEPCION_INVENTARIO,
            sourceEntityId: recepcion.id,
            serialId: serie.id,
            idempotencyKey: idempotencyKey ? `${idempotencyKey}-L${i}-S${j}` : undefined,
          });
        }
      } else {
        inputs.push({
          productId: linea.product_id,
          warehouseId: recepcion.warehouse_id,
          movementTypeId,
          quantity: Number(linea.quantity),
          unitCost,
          sourceModule: SOURCE_MODULE_RECEPCION_INVENTARIO,
          sourceEntityId: recepcion.id,
          idempotencyKey: idempotencyKey ? `${idempotencyKey}-L${i}` : undefined,
        });
      }
    }

    await this.movimientosService.registrarLote(context, inputs);

    for (const linea of recepcion.goods_receipt_lines) {
      if (linea.unit_cost === null) continue; // sin costo informado, no hay capa que crear
      await this.costeoService.registrarEntrada(context, {
        productId: linea.product_id,
        warehouseId: recepcion.warehouse_id,
        quantity: Number(linea.quantity),
        unitCost: Number(linea.unit_cost),
        sourceReceiptLineId: linea.id,
      });
    }

    return { ...recepcion, estado: 'confirmada' };
  }

  async cancelar(context: UserContext, id: string): Promise<RecepcionInventarioConEstado> {
    const recepcion = await this.recepcionRepository.obtener(context, id);
    if (!recepcion) throw new RecepcionInventarioNoEncontradaException(id);

    const estadoActual = await this.resolverEstado(context, recepcion);
    if (estadoActual === 'confirmada') throw new RecepcionNoCancelableException(id);
    if (estadoActual === 'cancelada') return { ...recepcion, estado: 'cancelada' };

    const anulada = await this.recepcionRepository.anular(context, id);
    return { ...recepcion, ...anulada, estado: 'cancelada' };
  }

  /** Estado derivado — el schema real no tiene columna de estado (mismo patrón que `purchases.goods_receipt_notes`, ISSUE-25). */
  private async resolverEstado(
    context: UserContext,
    recepcion: RecepcionInventarioConLineas,
  ): Promise<EstadoRecepcionInventario> {
    if (recepcion.deleted_at !== null) return 'cancelada';
    const movimientos = await this.movimientosService.listar(
      context,
      { source_module: SOURCE_MODULE_RECEPCION_INVENTARIO, source_entity_id: recepcion.id },
      { page: 1, pageSize: 1 },
    );
    return movimientos.meta.total > 0 ? 'confirmada' : 'borrador';
  }

  private async resolverTipoRecepcion(context: UserContext): Promise<string> {
    const resultado = await this.tipoMovimientoRepository.findMany(
      context,
      { code: CODIGO_TIPO_MOVIMIENTO_RECEPCION } as InventoryPrisma.stock_movement_typesWhereInput,
      { page: 1, pageSize: 1 },
    );
    const tipo = resultado.data[0];
    if (!tipo) {
      throw new TipoMovimientoRecepcionNoConfiguradoException(CODIGO_TIPO_MOVIMIENTO_RECEPCION);
    }
    return tipo.id;
  }
}
