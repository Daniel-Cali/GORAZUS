import type { UserContext } from '@gorazus/contracts';
import type {
  warehouses,
  stock,
  fifo_cost_layers,
  lifo_cost_layers,
  average_cost_history,
} from '@gorazus/core-database';
import { CostingMethodLookupRepository } from '../repositories/costing-method-lookup.repository';
import { FifoCostLayerRepository } from '../repositories/fifo-cost-layer.repository';
import { LifoCostLayerRepository } from '../repositories/lifo-cost-layer.repository';
import { AverageCostHistoryRepository } from '../repositories/average-cost-history.repository';
import { StockRepository } from '../repositories/stock.repository';
import { AlmacenRepository } from '../repositories/almacen.repository';
import { CapaDeCostoInsuficienteError } from '../repositories/cost-layer-lock.util';
import { ProductoInvalidoException, AlmacenInvalidoException } from './movimientos.service';
import {
  CosteoService,
  MetodoDeCosteoNoSoportadoException,
  CapaDeCostoInsuficienteException,
} from './costeo.service';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

const ALMACEN = { id: 'w-1', company_id: 'company-1', branch_id: 'branch-1' } as warehouses;

describe('CosteoService', () => {
  let almacen: warehouses | null;
  let metodoDeCosteo: string | null;
  let filaStock: stock | null;
  let ultimoPromedio: average_cost_history | null;
  let costingMethodLookupRepository: CostingMethodLookupRepository;
  let fifoCostLayerRepository: FifoCostLayerRepository;
  let lifoCostLayerRepository: LifoCostLayerRepository;
  let averageCostHistoryRepository: AverageCostHistoryRepository;
  let stockRepository: StockRepository;
  let almacenRepository: AlmacenRepository;

  beforeEach(() => {
    almacen = ALMACEN;
    metodoDeCosteo = 'fifo';
    filaStock = null;
    ultimoPromedio = null;

    almacenRepository = { findById: jest.fn(async () => almacen) } as unknown as AlmacenRepository;

    costingMethodLookupRepository = {
      obtenerMetodoDeCosteo: jest.fn(async () => metodoDeCosteo),
    } as unknown as CostingMethodLookupRepository;

    fifoCostLayerRepository = {
      crearCapa: jest.fn(async () => ({ id: 'fifo-layer-1' }) as fifo_cost_layers),
      consumir: jest.fn(async () => ({
        costoUnitarioPonderado: 10,
        capasConsumidas: [{ layerId: 'fifo-layer-1', quantityConsumed: 5, unitCost: 10 }],
      })),
      listarCapasActivas: jest.fn(async () => []),
    } as unknown as FifoCostLayerRepository;

    lifoCostLayerRepository = {
      crearCapa: jest.fn(async () => ({ id: 'lifo-layer-1' }) as lifo_cost_layers),
      consumir: jest.fn(async () => ({
        costoUnitarioPonderado: 12,
        capasConsumidas: [{ layerId: 'lifo-layer-1', quantityConsumed: 5, unitCost: 12 }],
      })),
      listarCapasActivas: jest.fn(async () => []),
    } as unknown as LifoCostLayerRepository;

    averageCostHistoryRepository = {
      obtenerUltimoPromedio: jest.fn(async () => ultimoPromedio),
      crearSnapshot: jest.fn(
        async () => ({ id: 'avg-1', new_average_cost: 15 }) as unknown as average_cost_history,
      ),
    } as unknown as AverageCostHistoryRepository;

    stockRepository = {
      obtener: jest.fn(async () => filaStock),
    } as unknown as StockRepository;
  });

  function buildService(): CosteoService {
    return new CosteoService(
      costingMethodLookupRepository,
      fifoCostLayerRepository,
      lifoCostLayerRepository,
      averageCostHistoryRepository,
      stockRepository,
      almacenRepository,
    );
  }

  const ENTRADA_BASE = { productId: 'p-1', warehouseId: 'w-1', quantity: 10, unitCost: 5 };
  const SALIDA_BASE = { productId: 'p-1', warehouseId: 'w-1', quantity: 5 };

  it('registrarEntrada: rechaza un almacén inexistente', async () => {
    almacen = null;
    await expect(buildService().registrarEntrada(CONTEXT, ENTRADA_BASE)).rejects.toThrow(
      AlmacenInvalidoException,
    );
  });

  it('registrarEntrada: rechaza un producto inexistente', async () => {
    metodoDeCosteo = null;
    await expect(buildService().registrarEntrada(CONTEXT, ENTRADA_BASE)).rejects.toThrow(
      ProductoInvalidoException,
    );
  });

  it('registrarEntrada: rechaza un método de costeo no soportado (standard/specific/etc.)', async () => {
    metodoDeCosteo = 'standard';
    await expect(buildService().registrarEntrada(CONTEXT, ENTRADA_BASE)).rejects.toThrow(
      MetodoDeCosteoNoSoportadoException,
    );
  });

  it('registrarEntrada fifo: crea una capa FIFO con los datos de la entrada', async () => {
    metodoDeCosteo = 'fifo';
    const resultado = await buildService().registrarEntrada(CONTEXT, ENTRADA_BASE);
    expect(fifoCostLayerRepository.crearCapa).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ productId: 'p-1', warehouseId: 'w-1', quantity: 10, unitCost: 5 }),
    );
    expect(resultado).toEqual({
      costingMethod: 'fifo',
      layerId: 'fifo-layer-1',
      newAverageCost: null,
    });
  });

  it('registrarEntrada lifo: crea una capa LIFO con los datos de la entrada', async () => {
    metodoDeCosteo = 'lifo';
    const resultado = await buildService().registrarEntrada(CONTEXT, ENTRADA_BASE);
    expect(lifoCostLayerRepository.crearCapa).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ productId: 'p-1', warehouseId: 'w-1', quantity: 10, unitCost: 5 }),
    );
    expect(resultado.costingMethod).toBe('lifo');
    expect(resultado.layerId).toBe('lifo-layer-1');
  });

  it('registrarEntrada average: sin historial previo, el promedio nuevo es el costo de la primera entrada', async () => {
    metodoDeCosteo = 'average';
    filaStock = null;
    ultimoPromedio = null;
    const resultado = await buildService().registrarEntrada(CONTEXT, ENTRADA_BASE);
    expect(averageCostHistoryRepository.crearSnapshot).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ newAverageCost: 5 }),
    );
    expect(resultado).toEqual({ costingMethod: 'average', layerId: null, newAverageCost: 5 });
  });

  it('registrarEntrada average: recalcula el promedio ponderado con saldo e historial existentes', async () => {
    metodoDeCosteo = 'average';
    filaStock = { quantity_on_hand: 10 } as unknown as stock;
    ultimoPromedio = { new_average_cost: 4 } as unknown as average_cost_history;
    // (10×4 + 10×5) / (10+10) = 90/20 = 4.5
    const resultado = await buildService().registrarEntrada(CONTEXT, ENTRADA_BASE);
    expect(resultado.newAverageCost).toBe(4.5);
  });

  it('resolverCostoDeSalida fifo: delega en FifoCostLayerRepository.consumir', async () => {
    metodoDeCosteo = 'fifo';
    const resultado = await buildService().resolverCostoDeSalida(CONTEXT, SALIDA_BASE);
    expect(fifoCostLayerRepository.consumir).toHaveBeenCalledWith(CONTEXT, SALIDA_BASE);
    expect(resultado.costingMethod).toBe('fifo');
    expect(resultado.costoUnitarioPonderado).toBe(10);
  });

  it('resolverCostoDeSalida lifo: delega en LifoCostLayerRepository.consumir', async () => {
    metodoDeCosteo = 'lifo';
    const resultado = await buildService().resolverCostoDeSalida(CONTEXT, SALIDA_BASE);
    expect(lifoCostLayerRepository.consumir).toHaveBeenCalledWith(CONTEXT, SALIDA_BASE);
    expect(resultado.costingMethod).toBe('lifo');
    expect(resultado.costoUnitarioPonderado).toBe(12);
  });

  it('resolverCostoDeSalida fifo: capas insuficientes se traduce a CapaDeCostoInsuficienteException', async () => {
    metodoDeCosteo = 'fifo';
    (fifoCostLayerRepository.consumir as jest.Mock).mockRejectedValueOnce(
      new CapaDeCostoInsuficienteError(3, 5),
    );
    await expect(buildService().resolverCostoDeSalida(CONTEXT, SALIDA_BASE)).rejects.toThrow(
      CapaDeCostoInsuficienteException,
    );
  });

  it('resolverCostoDeSalida average: sin snapshot previo, rechaza (política estricta)', async () => {
    metodoDeCosteo = 'average';
    ultimoPromedio = null;
    await expect(buildService().resolverCostoDeSalida(CONTEXT, SALIDA_BASE)).rejects.toThrow(
      CapaDeCostoInsuficienteException,
    );
  });

  it('resolverCostoDeSalida average: con snapshot, devuelve el costo vigente', async () => {
    metodoDeCosteo = 'average';
    ultimoPromedio = { new_average_cost: 7.5 } as unknown as average_cost_history;
    const resultado = await buildService().resolverCostoDeSalida(CONTEXT, SALIDA_BASE);
    expect(resultado).toEqual({
      costingMethod: 'average',
      costoUnitarioPonderado: 7.5,
      capasConsumidas: [],
    });
  });

  it('listarCapasActivas average: siempre devuelve layers vacío (sin capas, ver costo-vigente)', async () => {
    metodoDeCosteo = 'average';
    const resultado = await buildService().listarCapasActivas(CONTEXT, {
      productId: 'p-1',
      warehouseId: 'w-1',
    });
    expect(resultado).toEqual({ costingMethod: 'average', layers: [] });
  });

  it('listarCapasActivas fifo: mapea las capas reales a la forma pública', async () => {
    metodoDeCosteo = 'fifo';
    (fifoCostLayerRepository.listarCapasActivas as jest.Mock).mockResolvedValueOnce([
      { id: 'l-1', original_quantity: 10, remaining_quantity: 4, unit_cost: 10 },
    ]);
    const resultado = await buildService().listarCapasActivas(CONTEXT, {
      productId: 'p-1',
      warehouseId: 'w-1',
    });
    expect(resultado).toEqual({
      costingMethod: 'fifo',
      layers: [{ id: 'l-1', originalQuantity: 10, remainingQuantity: 4, unitCost: 10 }],
    });
  });

  it('obtenerCostoVigente average: lee el último snapshot', async () => {
    metodoDeCosteo = 'average';
    ultimoPromedio = { new_average_cost: 8 } as unknown as average_cost_history;
    const resultado = await buildService().obtenerCostoVigente(CONTEXT, {
      productId: 'p-1',
      warehouseId: 'w-1',
    });
    expect(resultado).toEqual({ costingMethod: 'average', unitCost: 8 });
  });

  it('obtenerCostoVigente fifo: usa el costo de la primera capa activa (próxima a consumir)', async () => {
    metodoDeCosteo = 'fifo';
    (fifoCostLayerRepository.listarCapasActivas as jest.Mock).mockResolvedValueOnce([
      { id: 'l-1', original_quantity: 10, remaining_quantity: 4, unit_cost: 9 },
    ]);
    const resultado = await buildService().obtenerCostoVigente(CONTEXT, {
      productId: 'p-1',
      warehouseId: 'w-1',
    });
    expect(resultado).toEqual({ costingMethod: 'fifo', unitCost: 9 });
  });

  it('obtenerCostoVigente fifo: sin capas activas, devuelve unitCost null', async () => {
    metodoDeCosteo = 'fifo';
    const resultado = await buildService().obtenerCostoVigente(CONTEXT, {
      productId: 'p-1',
      warehouseId: 'w-1',
    });
    expect(resultado).toEqual({ costingMethod: 'fifo', unitCost: null });
  });
});
