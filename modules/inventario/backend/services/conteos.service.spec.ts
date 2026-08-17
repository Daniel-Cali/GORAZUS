import type { UserContext } from '@gorazus/contracts';
import type {
  stock,
  stock_adjustment_reasons,
  warehouses,
  warehouse_zones,
  PaginatedResult,
} from '@gorazus/core-database';
import {
  ConteoFisicoRepository,
  type ConteoConLineas,
} from '../repositories/conteo-fisico.repository';
import type { AjusteConLineas } from '../repositories/ajuste-stock.repository';
import { StockRepository } from '../repositories/stock.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import { AlmacenRepository } from '../repositories/almacen.repository';
import { ZonaAlmacenRepository } from '../repositories/zona-almacen.repository';
import { MotivoAjusteRepository } from '../repositories/motivo-ajuste.repository';
import { InventoryLotRepository } from '../repositories/inventory-lot.repository';
import { InventorySerialRepository } from '../repositories/inventory-serial.repository';
import { AjustesService } from './ajustes.service';
import { AlmacenInvalidoException, ProductoInvalidoException } from './movimientos.service';
import {
  ConteosService,
  ConteoNoEncontradoException,
  TransicionConteoInvalidaException,
  LineaConteoNoEncontradaException,
  ConteoSinStockException,
  ConteoIncompletoException,
  ZonaInvalidaException,
  MotivoDiferenciaConteoNoConfiguradoException,
} from './conteos.service';
import type { CrearConteoInput } from '../validators/conteos.schema';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

const ALMACEN = { id: 'w-1', company_id: 'company-1', branch_id: 'branch-1' } as warehouses;
const ZONA = { id: 'z-1', warehouse_id: 'w-1' } as warehouse_zones;

function buildConteo(overrides: Partial<ConteoConLineas> = {}): ConteoConLineas {
  return {
    id: 'c-1',
    warehouse_id: 'w-1',
    status: 'planned',
    physical_count_lines: [
      { id: 'l-1', product_id: 'p-1', system_quantity: 10, counted_quantity: null } as never,
    ],
    ...overrides,
  } as ConteoConLineas;
}

describe('ConteosService', () => {
  let almacen: warehouses | null;
  let zona: warehouse_zones | null;
  let productoValido: boolean;
  let conteo: ConteoConLineas;
  let filasStock: stock[];
  let motivosDisponibles: stock_adjustment_reasons[];
  let conteoRepository: ConteoFisicoRepository;
  let stockRepository: StockRepository;
  let productoLookupRepository: ProductoLookupRepository;
  let almacenRepository: AlmacenRepository;
  let zonaAlmacenRepository: ZonaAlmacenRepository;
  let motivoAjusteRepository: MotivoAjusteRepository;
  let inventoryLotRepository: InventoryLotRepository;
  let inventorySerialRepository: InventorySerialRepository;
  let ajustesService: AjustesService;

  beforeEach(() => {
    almacen = ALMACEN;
    zona = ZONA;
    productoValido = true;
    conteo = buildConteo();
    filasStock = [{ product_id: 'p-1', quantity_on_hand: 12 } as unknown as stock];
    motivosDisponibles = [{ id: 'r-1', name: 'Diferencia de Conteo' } as stock_adjustment_reasons];

    conteoRepository = {
      crear: jest.fn(async () => conteo),
      obtener: jest.fn(async () => conteo),
      listar: jest.fn(async () => ({ data: [], meta: { page: 1, pageSize: 20, total: 0 } })),
      actualizarEstado: jest.fn(async (_ctx: unknown, _id: string, status: string) => {
        conteo = { ...conteo, status } as ConteoConLineas;
        return conteo;
      }),
      capturarLinea: jest.fn(async (_ctx: unknown, lineaId: string, countedQuantity: number) => ({
        id: lineaId,
        product_id: 'p-1',
        counted_quantity: countedQuantity,
      })),
    } as unknown as ConteoFisicoRepository;

    stockRepository = {
      obtener: jest.fn(async () => filasStock[0] ?? null),
      listar: jest.fn(async () => ({
        data: filasStock,
        meta: { page: 1, pageSize: 10000, total: filasStock.length },
      })),
    } as unknown as StockRepository;

    productoLookupRepository = {
      existeProducto: jest.fn(async () => productoValido),
    } as unknown as ProductoLookupRepository;

    almacenRepository = { findById: jest.fn(async () => almacen) } as unknown as AlmacenRepository;
    zonaAlmacenRepository = {
      findById: jest.fn(async () => zona),
    } as unknown as ZonaAlmacenRepository;
    motivoAjusteRepository = {
      findMany: jest.fn(async (_ctx: unknown, filter: { name?: string }) => {
        const data = motivosDisponibles.filter((m) => !filter.name || m.name === filter.name);
        return {
          data,
          meta: { page: 1, pageSize: 1, total: data.length },
        } as PaginatedResult<stock_adjustment_reasons>;
      }),
    } as unknown as MotivoAjusteRepository;

    ajustesService = {
      crear: jest.fn(async () => ({ id: 'aj-1' }) as AjusteConLineas),
    } as unknown as AjustesService;

    inventoryLotRepository = {
      listar: jest.fn(async () => ({ data: [], meta: { page: 1, pageSize: 10000, total: 0 } })),
    } as unknown as InventoryLotRepository;

    inventorySerialRepository = {
      listar: jest.fn(async () => ({ data: [], meta: { page: 1, pageSize: 10000, total: 0 } })),
      obtenerPorId: jest.fn(async () => null),
    } as unknown as InventorySerialRepository;
  });

  function buildService(): ConteosService {
    return new ConteosService(
      conteoRepository,
      stockRepository,
      productoLookupRepository,
      almacenRepository,
      zonaAlmacenRepository,
      motivoAjusteRepository,
      inventoryLotRepository,
      inventorySerialRepository,
      ajustesService,
    );
  }

  function baseInput(overrides: Partial<CrearConteoInput> = {}): CrearConteoInput {
    return {
      warehouseId: 'w-1',
      scheduledDate: new Date('2026-08-01'),
      countBy: 'product',
      ...overrides,
    };
  }

  it('crear: rechaza un almacén inexistente', async () => {
    almacen = null;
    await expect(buildService().crear(CONTEXT, baseInput())).rejects.toThrow(
      AlmacenInvalidoException,
    );
  });

  it('crear: rechaza una zona que no pertenece al almacén', async () => {
    zona = { id: 'z-1', warehouse_id: 'w-otro' } as warehouse_zones;
    await expect(buildService().crear(CONTEXT, baseInput({ zoneId: 'z-1' }))).rejects.toThrow(
      ZonaInvalidaException,
    );
  });

  it('crear con productIds: rechaza un producto inexistente', async () => {
    productoValido = false;
    await expect(buildService().crear(CONTEXT, baseInput({ productIds: ['p-1'] }))).rejects.toThrow(
      ProductoInvalidoException,
    );
  });

  it('crear con productIds: resuelve systemQuantity del stock real', async () => {
    await buildService().crear(CONTEXT, baseInput({ productIds: ['p-1'] }));
    expect(conteoRepository.crear).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({
        lines: [expect.objectContaining({ productId: 'p-1', systemQuantity: 12 })],
      }),
    );
  });

  it('crear sin productIds: autogenera desde el stock del almacén', async () => {
    await buildService().crear(CONTEXT, baseInput());
    expect(stockRepository.listar).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ warehouse_id: 'w-1' }),
      expect.anything(),
    );
    expect(conteoRepository.crear).toHaveBeenCalled();
  });

  it('crear sin productIds y sin stock disponible: rechaza', async () => {
    filasStock = [];
    await expect(buildService().crear(CONTEXT, baseInput())).rejects.toThrow(
      ConteoSinStockException,
    );
  });

  it('obtener: conteo inexistente lanza ConteoNoEncontradoException', async () => {
    (conteoRepository.obtener as jest.Mock).mockResolvedValueOnce(null);
    await expect(buildService().obtener(CONTEXT, 'c-x')).rejects.toThrow(
      ConteoNoEncontradoException,
    );
  });

  it('iniciar: rechaza si no está planned', async () => {
    conteo = buildConteo({ status: 'completed' });
    (conteoRepository.obtener as jest.Mock).mockResolvedValueOnce(conteo);
    await expect(buildService().iniciar(CONTEXT, 'c-1')).rejects.toThrow(
      TransicionConteoInvalidaException,
    );
  });

  it('iniciar: caso feliz pasa a in_progress', async () => {
    const actualizado = await buildService().iniciar(CONTEXT, 'c-1');
    expect(actualizado.status).toBe('in_progress');
  });

  it('capturarLinea: rechaza si el conteo no está in_progress', async () => {
    await expect(buildService().capturarLinea(CONTEXT, 'c-1', 'l-1', 9)).rejects.toThrow(
      TransicionConteoInvalidaException,
    );
  });

  it('capturarLinea: rechaza una línea inexistente', async () => {
    conteo = buildConteo({ status: 'in_progress' });
    (conteoRepository.obtener as jest.Mock).mockResolvedValue(conteo);
    await expect(buildService().capturarLinea(CONTEXT, 'c-1', 'l-x', 9)).rejects.toThrow(
      LineaConteoNoEncontradaException,
    );
  });

  it('capturarLinea: caso feliz nunca expone systemQuantity', async () => {
    conteo = buildConteo({ status: 'in_progress' });
    (conteoRepository.obtener as jest.Mock).mockResolvedValue(conteo);
    const resultado = await buildService().capturarLinea(CONTEXT, 'c-1', 'l-1', 9);
    expect(resultado).toEqual({ id: 'l-1', productId: 'p-1', countedQuantity: 9 });
    expect(resultado).not.toHaveProperty('systemQuantity');
  });

  it('completar: rechaza si no está in_progress', async () => {
    await expect(buildService().completar(CONTEXT, 'c-1')).rejects.toThrow(
      TransicionConteoInvalidaException,
    );
  });

  it('completar: rechaza si hay líneas sin capturar', async () => {
    conteo = buildConteo({ status: 'in_progress' });
    (conteoRepository.obtener as jest.Mock).mockResolvedValue(conteo);
    await expect(buildService().completar(CONTEXT, 'c-1')).rejects.toThrow(
      ConteoIncompletoException,
    );
  });

  it('completar: sin discrepancias no genera ajuste', async () => {
    conteo = buildConteo({
      status: 'in_progress',
      physical_count_lines: [
        { id: 'l-1', product_id: 'p-1', system_quantity: 10, counted_quantity: 10 } as never,
      ],
    });
    (conteoRepository.obtener as jest.Mock).mockResolvedValue(conteo);
    const resultado = await buildService().completar(CONTEXT, 'c-1');
    expect(resultado.ajusteGeneradoId).toBeNull();
    expect(ajustesService.crear).not.toHaveBeenCalled();
    expect(resultado.conteo.status).toBe('completed');
  });

  it('completar: con discrepancias genera un ajuste vía AjustesService', async () => {
    conteo = buildConteo({
      status: 'in_progress',
      physical_count_lines: [
        { id: 'l-1', product_id: 'p-1', system_quantity: 10, counted_quantity: 7 } as never,
      ],
    });
    (conteoRepository.obtener as jest.Mock).mockResolvedValue(conteo);
    const resultado = await buildService().completar(CONTEXT, 'c-1');
    expect(resultado.ajusteGeneradoId).toBe('aj-1');
    expect(ajustesService.crear).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({
        warehouseId: 'w-1',
        reasonId: 'r-1',
        lines: [expect.objectContaining({ productId: 'p-1', newQuantity: 7 })],
      }),
    );
  });

  // "Physical count traceability" (test requirement de misión): countBy
  // 'lot' autogenera una línea por lote con remaining_quantity > 0.
  it('crear countBy lot: autogenera una línea por lote con lotId', async () => {
    (inventoryLotRepository.listar as jest.Mock).mockResolvedValueOnce({
      data: [{ id: 'lot-1', product_id: 'p-1', remaining_quantity: 30 }],
      meta: { page: 1, pageSize: 10000, total: 1 },
    });
    await buildService().crear(CONTEXT, baseInput({ countBy: 'lot' }));
    expect(conteoRepository.crear).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({
        lines: [expect.objectContaining({ productId: 'p-1', systemQuantity: 30, lotId: 'lot-1' })],
      }),
    );
  });

  it('crear countBy serial: autogenera una línea por serie disponible con serialId', async () => {
    (inventorySerialRepository.listar as jest.Mock).mockResolvedValueOnce({
      data: [{ id: 'serial-1', product_id: 'p-1' }],
      meta: { page: 1, pageSize: 10000, total: 1 },
    });
    await buildService().crear(CONTEXT, baseInput({ countBy: 'serial' }));
    expect(conteoRepository.crear).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({
        lines: [
          expect.objectContaining({ productId: 'p-1', systemQuantity: 1, serialId: 'serial-1' }),
        ],
      }),
    );
  });

  it('completar: con discrepancia de línea con lote, genera el ajuste referenciando el mismo lotId', async () => {
    conteo = buildConteo({
      status: 'in_progress',
      physical_count_lines: [
        {
          id: 'l-1',
          product_id: 'p-1',
          system_quantity: 10,
          counted_quantity: 7,
          lot_id: 'lot-1',
        } as never,
      ],
    });
    (conteoRepository.obtener as jest.Mock).mockResolvedValue(conteo);
    await buildService().completar(CONTEXT, 'c-1');
    expect(ajustesService.crear).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({
        lines: [expect.objectContaining({ productId: 'p-1', newQuantity: 7, lotId: 'lot-1' })],
      }),
    );
  });

  it('completar: rechaza si no existe el motivo "Diferencia de Conteo"', async () => {
    motivosDisponibles = [];
    conteo = buildConteo({
      status: 'in_progress',
      physical_count_lines: [
        { id: 'l-1', product_id: 'p-1', system_quantity: 10, counted_quantity: 7 } as never,
      ],
    });
    (conteoRepository.obtener as jest.Mock).mockResolvedValue(conteo);
    await expect(buildService().completar(CONTEXT, 'c-1')).rejects.toThrow(
      MotivoDiferenciaConteoNoConfiguradoException,
    );
  });
});
