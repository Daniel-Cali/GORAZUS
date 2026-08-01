import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import { DomainException } from '@gorazus/core-http';
import { CostingMethodLookupRepository } from '../repositories/costing-method-lookup.repository';
import { FifoCostLayerRepository } from '../repositories/fifo-cost-layer.repository';
import { LifoCostLayerRepository } from '../repositories/lifo-cost-layer.repository';
import { AverageCostHistoryRepository } from '../repositories/average-cost-history.repository';
import { StockRepository } from '../repositories/stock.repository';
import { AlmacenRepository } from '../repositories/almacen.repository';
import { CapaDeCostoInsuficienteError } from '../repositories/cost-layer-lock.util';
import { ProductoInvalidoException, AlmacenInvalidoException } from './movimientos.service';
import type {
  RegistrarEntradaCosteoInput,
  ResolverCostoSalidaInput,
} from '../validators/costeo.schema';

const METODOS_SOPORTADOS = ['fifo', 'lifo', 'average'] as const;
type MetodoDeCosteoSoportado = (typeof METODOS_SOPORTADOS)[number];

export class MetodoDeCosteoNoSoportadoException extends DomainException {
  constructor(costingMethod: string) {
    super(
      'METODO_DE_COSTEO_NO_SOPORTADO',
      `El método de costeo "${costingMethod}" no está implementado todavía (fase 1 de ADR-INV-004: solo fifo/lifo/average).`,
      400,
    );
  }
}

export class CapaDeCostoInsuficienteException extends DomainException {
  constructor(disponible: number, solicitado: number) {
    super(
      'CAPA_DE_COSTO_INSUFICIENTE',
      `Costo insuficiente para resolver la salida: disponible ${disponible}, solicitado ${solicitado} (política estricta, ADR-INV-004 §6).`,
      409,
    );
  }
}

export interface CapaConsumidaResultado {
  layerId: string;
  quantityConsumed: number;
  unitCost: number;
}

export interface ResultadoEntradaCosteo {
  costingMethod: MetodoDeCosteoSoportado;
  layerId: string | null;
  newAverageCost: number | null;
}

export interface ResultadoSalidaCosteo {
  costingMethod: MetodoDeCosteoSoportado;
  costoUnitarioPonderado: number;
  capasConsumidas: CapaConsumidaResultado[];
}

export interface CapaActivaResultado {
  id: string;
  originalQuantity: number;
  remainingQuantity: number;
  unitCost: number;
}

/**
 * Motor de Costeo — Fase 1 de `ADR-INV-004`: FIFO, LIFO y Costo Promedio
 * Ponderado, los tres únicos métodos con tabla real hoy
 * (`fifo_cost_layers`/`lifo_cost_layers`/`average_cost_history`).
 * Standard/Specific/Landed/Replacement Cost quedan fuera — sin tabla real
 * todavía, lanzan `MetodoDeCosteoNoSoportadoException` en vez de fallar
 * en silencio.
 *
 * Servicio standalone, no conectado a `MovimientosService` en esta fase
 * (mismo criterio que el plan de implementación aprobado): registrar
 * entradas/salidas de costo es una llamada explícita, no un efecto
 * secundario automático de cada movimiento de stock — evita arriesgar el
 * comportamiento ya probado de `MovimientosService`.
 *
 * Política de inventario negativo: solo `strict` (bloquear, `ADR-INV-004
 * §6`, comportamiento por defecto) — `allow_estimated`/`allow_zero_cost`
 * quedan para una fase posterior.
 */
@Injectable()
export class CosteoService {
  constructor(
    private readonly costingMethodLookupRepository: CostingMethodLookupRepository,
    private readonly fifoCostLayerRepository: FifoCostLayerRepository,
    private readonly lifoCostLayerRepository: LifoCostLayerRepository,
    private readonly averageCostHistoryRepository: AverageCostHistoryRepository,
    private readonly stockRepository: StockRepository,
    private readonly almacenRepository: AlmacenRepository,
  ) {}

  async registrarEntrada(
    context: UserContext,
    input: RegistrarEntradaCosteoInput,
  ): Promise<ResultadoEntradaCosteo> {
    await this.validarAlmacen(context, input.warehouseId);
    const metodo = await this.resolverMetodoSoportado(context, input.productId);

    if (metodo === 'fifo') {
      const capa = await this.fifoCostLayerRepository.crearCapa(context, {
        productId: input.productId,
        warehouseId: input.warehouseId,
        quantity: input.quantity,
        unitCost: input.unitCost,
        sourceReceiptLineId: input.sourceReceiptLineId ?? null,
      });
      return { costingMethod: 'fifo', layerId: capa.id, newAverageCost: null };
    }

    if (metodo === 'lifo') {
      const capa = await this.lifoCostLayerRepository.crearCapa(context, {
        productId: input.productId,
        warehouseId: input.warehouseId,
        quantity: input.quantity,
        unitCost: input.unitCost,
      });
      return { costingMethod: 'lifo', layerId: capa.id, newAverageCost: null };
    }

    const newAverageCost = await this.recalcularPromedioPonderado(context, input);
    await this.averageCostHistoryRepository.crearSnapshot(context, {
      productId: input.productId,
      warehouseId: input.warehouseId,
      newAverageCost,
    });
    return { costingMethod: 'average', layerId: null, newAverageCost };
  }

  async resolverCostoDeSalida(
    context: UserContext,
    input: ResolverCostoSalidaInput,
  ): Promise<ResultadoSalidaCosteo> {
    await this.validarAlmacen(context, input.warehouseId);
    const metodo = await this.resolverMetodoSoportado(context, input.productId);

    if (metodo === 'fifo') {
      const resultado = await this.fifoCostLayerRepository
        .consumir(context, input)
        .catch(this.traducirErrorDeCapaInsuficiente);
      return { costingMethod: 'fifo', ...resultado };
    }

    if (metodo === 'lifo') {
      const resultado = await this.lifoCostLayerRepository
        .consumir(context, input)
        .catch(this.traducirErrorDeCapaInsuficiente);
      return { costingMethod: 'lifo', ...resultado };
    }

    const ultimoPromedio = await this.averageCostHistoryRepository.obtenerUltimoPromedio(
      context,
      input,
    );
    if (!ultimoPromedio) {
      throw new CapaDeCostoInsuficienteException(0, input.quantity);
    }
    return {
      costingMethod: 'average',
      costoUnitarioPonderado: Number(ultimoPromedio.new_average_cost),
      capasConsumidas: [],
    };
  }

  async listarCapasActivas(
    context: UserContext,
    params: { productId: string; warehouseId: string },
  ): Promise<{ costingMethod: MetodoDeCosteoSoportado; layers: CapaActivaResultado[] }> {
    await this.validarAlmacen(context, params.warehouseId);
    const metodo = await this.resolverMetodoSoportado(context, params.productId);

    if (metodo === 'average') return { costingMethod: 'average', layers: [] };

    const repositorio =
      metodo === 'fifo' ? this.fifoCostLayerRepository : this.lifoCostLayerRepository;
    const capas = await repositorio.listarCapasActivas(context, params);
    return {
      costingMethod: metodo,
      layers: capas.map((capa) => ({
        id: capa.id,
        originalQuantity: Number(capa.original_quantity),
        remainingQuantity: Number(capa.remaining_quantity),
        unitCost: Number(capa.unit_cost),
      })),
    };
  }

  /** Costo vigente = costo de la próxima capa a consumir (`listarCapasActivas` ya devuelve las capas en el orden real de consumo: FIFO más antigua primero, LIFO más nueva primero) o el último snapshot de Promedio. `null` si no hay costo registrado todavía. */
  async obtenerCostoVigente(
    context: UserContext,
    params: { productId: string; warehouseId: string },
  ): Promise<{ costingMethod: MetodoDeCosteoSoportado; unitCost: number | null }> {
    await this.validarAlmacen(context, params.warehouseId);
    const metodo = await this.resolverMetodoSoportado(context, params.productId);

    if (metodo === 'average') {
      const ultimo = await this.averageCostHistoryRepository.obtenerUltimoPromedio(context, params);
      return {
        costingMethod: 'average',
        unitCost: ultimo ? Number(ultimo.new_average_cost) : null,
      };
    }

    const { layers } = await this.listarCapasActivas(context, params);
    return { costingMethod: metodo, unitCost: layers[0]?.unitCost ?? null };
  }

  private async validarAlmacen(context: UserContext, warehouseId: string): Promise<void> {
    const almacen = await this.almacenRepository.findById(context, { id: warehouseId });
    if (!almacen) throw new AlmacenInvalidoException(warehouseId);
  }

  private async resolverMetodoSoportado(
    context: UserContext,
    productId: string,
  ): Promise<MetodoDeCosteoSoportado> {
    const metodo = await this.costingMethodLookupRepository.obtenerMetodoDeCosteo(
      context,
      productId,
    );
    if (metodo === null) throw new ProductoInvalidoException(productId);
    if (!this.esMetodoSoportado(metodo)) throw new MetodoDeCosteoNoSoportadoException(metodo);
    return metodo;
  }

  private esMetodoSoportado(metodo: string): metodo is MetodoDeCosteoSoportado {
    return (METODOS_SOPORTADOS as readonly string[]).includes(metodo);
  }

  /** `nuevo_promedio = (cantidad_actual×promedio_actual + cantidad_recibida×costo_recibido) / (cantidad_actual+cantidad_recibida)` — fórmula ya documentada en `Cost Engine.md`, sin capas. */
  private async recalcularPromedioPonderado(
    context: UserContext,
    input: RegistrarEntradaCosteoInput,
  ): Promise<number> {
    const filaStock = await this.stockRepository.obtener(context, {
      productId: input.productId,
      warehouseId: input.warehouseId,
      locationId: null,
    });
    const cantidadActual = filaStock ? Number(filaStock.quantity_on_hand) : 0;

    const ultimoPromedio = await this.averageCostHistoryRepository.obtenerUltimoPromedio(context, {
      productId: input.productId,
      warehouseId: input.warehouseId,
    });
    const promedioActual = ultimoPromedio
      ? Number(ultimoPromedio.new_average_cost)
      : input.unitCost;

    const cantidadResultante = cantidadActual + input.quantity;
    if (cantidadResultante <= 0) return input.unitCost;

    const totalActual = cantidadActual * promedioActual;
    const totalEntrante = input.quantity * input.unitCost;
    return (totalActual + totalEntrante) / cantidadResultante;
  }

  private traducirErrorDeCapaInsuficiente(error: unknown): never {
    if (error instanceof CapaDeCostoInsuficienteError) {
      throw new CapaDeCostoInsuficienteException(error.disponible, error.solicitado);
    }
    throw error;
  }
}
