import type { UserContext } from '@gorazus/contracts';
import type { warehouses, stock_movements } from '@gorazus/core-database';
import {
  GoodsIssueRepository,
  type SalidaInventarioConLineas,
} from '../repositories/goods-issue.repository';
import { AlmacenRepository } from '../repositories/almacen.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import { TipoMovimientoStockRepository } from '../repositories/tipo-movimiento-stock.repository';
import { StockInsuficienteError } from '../repositories/movimiento-stock.repository';
import { InventoryLotRepository } from '../repositories/inventory-lot.repository';
import { InventorySerialRepository } from '../repositories/inventory-serial.repository';
import { MovimientosService } from './movimientos.service';
import { CosteoService } from './costeo.service';
import {
  SalidasInventarioService,
  SalidaInventarioInvalidaException,
  SalidaYaConfirmadaException,
  StockInsuficienteException,
  LoteOSerieRequeridoException,
  LoteInvalidoException,
  SerieInvalidaException,
} from './salidas-inventario.service';
import type { CrearSalidaInventarioInput } from '../validators/salidas-inventario.schema';

const CONTEXT_TENANT_A: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-A',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

const ALMACEN = { id: 'w-1', company_id: 'company-1', branch_id: 'branch-1' } as warehouses;
const TIPO_SALIDA = { id: 'mt-issue', code: 'issue', direction: 'out' };

function buildSalida(
  overrides: Partial<SalidaInventarioConLineas> = {},
): SalidaInventarioConLineas {
  return {
    id: 'gi-1',
    tenant_id: 'tenant-A',
    company_id: 'company-1',
    branch_id: 'branch-1',
    warehouse_id: 'w-1',
    deleted_at: null,
    goods_issue_lines: [{ id: 'gil-1', product_id: 'p-1', quantity: 10 }],
    ...overrides,
  } as unknown as SalidaInventarioConLineas;
}

describe('SalidasInventarioService', () => {
  let almacen: warehouses | null;
  let productoValido: boolean;
  let movimientosExistentes: number;
  let registrarLoteError: Error | null;
  let salidaRepository: GoodsIssueRepository;
  let almacenRepository: AlmacenRepository;
  let productoLookupRepository: ProductoLookupRepository;
  let tipoMovimientoRepository: TipoMovimientoStockRepository;
  let inventoryLotRepository: InventoryLotRepository;
  let inventorySerialRepository: InventorySerialRepository;
  let movimientosService: MovimientosService;
  let costeoService: CosteoService;
  let controlProducto: { tracksLot: boolean; tracksSerial: boolean };
  let loteExistente: { id: string; product_id: string; remaining_quantity: number } | null;
  let serieExistente: { id: string; product_id: string; status: string } | null;

  beforeEach(() => {
    almacen = ALMACEN;
    productoValido = true;
    movimientosExistentes = 0;
    registrarLoteError = null;
    controlProducto = { tracksLot: false, tracksSerial: false };
    loteExistente = { id: 'lot-1', product_id: 'p-1', remaining_quantity: 10 };
    serieExistente = { id: 'serial-1', product_id: 'p-1', status: 'in_stock' };

    salidaRepository = {
      crear: jest.fn(async () => buildSalida()),
      obtener: jest.fn(async () => buildSalida()),
      listar: jest.fn(async () => ({ data: [], meta: { page: 1, pageSize: 20, total: 0 } })),
      anular: jest.fn(async () => ({ ...buildSalida(), deleted_at: new Date() })),
    } as unknown as GoodsIssueRepository;

    almacenRepository = { findById: jest.fn(async () => almacen) } as unknown as AlmacenRepository;

    productoLookupRepository = {
      existeProducto: jest.fn(async () => productoValido),
      obtenerControl: jest.fn(async () => controlProducto),
    } as unknown as ProductoLookupRepository;

    tipoMovimientoRepository = {
      findMany: jest.fn(async () => ({
        data: [TIPO_SALIDA],
        meta: { page: 1, pageSize: 1, total: 1 },
      })),
    } as unknown as TipoMovimientoStockRepository;

    inventoryLotRepository = {
      obtenerPorId: jest.fn(async () => loteExistente),
      consumir: jest.fn(async () => ({ id: 'lot-1', remaining_quantity: 0 })),
    } as unknown as InventoryLotRepository;

    inventorySerialRepository = {
      obtenerPorNumero: jest.fn(async () => serieExistente),
      emitir: jest.fn(async () => ({ id: 'serial-1', status: 'issued' })),
    } as unknown as InventorySerialRepository;

    movimientosService = {
      registrarLote: jest.fn(async (_ctx: unknown, items: unknown[]) => {
        if (registrarLoteError) throw registrarLoteError;
        return items.map((_, i) => ({
          movimiento: { id: `mv-${i}` } as stock_movements,
          stockActualizado: {} as never,
        }));
      }),
      listar: jest.fn(async () => ({
        data: [],
        meta: { page: 1, pageSize: 1, total: movimientosExistentes },
      })),
    } as unknown as MovimientosService;

    costeoService = {
      resolverCostoDeSalida: jest.fn(async () => ({
        costingMethod: 'fifo',
        costoUnitarioPonderado: 5,
        capasConsumidas: [],
      })),
    } as unknown as CosteoService;
  });

  function buildService(): SalidasInventarioService {
    return new SalidasInventarioService(
      salidaRepository,
      almacenRepository,
      productoLookupRepository,
      tipoMovimientoRepository,
      inventoryLotRepository,
      inventorySerialRepository,
      movimientosService,
      costeoService,
    );
  }

  const inputBase: CrearSalidaInventarioInput = {
    warehouseId: 'w-1',
    lines: [{ productId: 'p-1', quantity: 10 }],
  };

  // Caso 1: crear borrador — sin movimiento de stock.
  it('crear: registra la salida en borrador, sin tocar movimientos', async () => {
    const resultado = await buildService().crear(CONTEXT_TENANT_A, inputBase);
    expect(resultado.estado).toBe('borrador');
    expect(movimientosService.registrarLote).not.toHaveBeenCalled();
  });

  // Caso 2: confirmar — estado confirmada, movimiento OUT creado, costeo aplicado.
  it('confirmar: crea movimiento OUT por línea, aplica costeo, devuelve estado confirmada', async () => {
    const resultado = await buildService().confirmar(CONTEXT_TENANT_A, 'gi-1');
    expect(resultado.estado).toBe('confirmada');
    expect(movimientosService.registrarLote).toHaveBeenCalledWith(
      CONTEXT_TENANT_A,
      expect.arrayContaining([
        expect.objectContaining({
          productId: 'p-1',
          warehouseId: 'w-1',
          movementTypeId: 'mt-issue',
        }),
      ]),
    );
    expect(costeoService.resolverCostoDeSalida).toHaveBeenCalledWith(
      CONTEXT_TENANT_A,
      expect.objectContaining({ productId: 'p-1', quantity: 10 }),
    );
  });

  // Caso 3: stock insuficiente — rechazada, traduce el error del motor de movimientos.
  it('confirmar: rechaza si el motor de movimientos reporta stock insuficiente', async () => {
    registrarLoteError = new StockInsuficienteError(3, 10);
    await expect(buildService().confirmar(CONTEXT_TENANT_A, 'gi-1')).rejects.toThrow(
      StockInsuficienteException,
    );
    expect(costeoService.resolverCostoDeSalida).not.toHaveBeenCalled();
  });

  // Caso 4: doble confirmación — rechazada.
  it('confirmar: rechaza una segunda confirmación (ya existen movimientos)', async () => {
    movimientosExistentes = 1;
    await expect(buildService().confirmar(CONTEXT_TENANT_A, 'gi-1')).rejects.toThrow(
      SalidaYaConfirmadaException,
    );
    expect(movimientosService.registrarLote).not.toHaveBeenCalled();
  });

  // Caso 5: aislamiento de tenant — el servicio propaga el UserContext real
  // al repositorio; la exclusión cruzada de tenant la aplica Postgres RLS +
  // `withTenantScope` (no verificable con un mock, requiere Postgres real).
  it('obtener: propaga el tenantId del contexto real al repositorio', async () => {
    const contextTenantB: UserContext = { ...CONTEXT_TENANT_A, tenantId: 'tenant-B' };
    await buildService().obtener(contextTenantB, 'gi-1');
    expect(salidaRepository.obtener).toHaveBeenCalledWith(contextTenantB, 'gi-1');
  });

  // Caso 6: cantidad inválida — error de validación (invariante de entidad).
  it('crear: rechaza cantidad cero (invariante de la entidad)', async () => {
    await expect(
      buildService().crear(CONTEXT_TENANT_A, {
        warehouseId: 'w-1',
        lines: [{ productId: 'p-1', quantity: 0 }],
      }),
    ).rejects.toThrow(SalidaInventarioInvalidaException);
    expect(salidaRepository.crear).not.toHaveBeenCalled();
  });

  // Test de misión #3 (Lotes): "Issue from lot" → movimiento OUT linkeado al lote,
  // con consumo atómico de `remaining_quantity` antes del movimiento.
  it('confirmar: con línea de lote, consume el lote y crea el movimiento OUT con lotId', async () => {
    (salidaRepository.obtener as jest.Mock).mockResolvedValue(
      buildSalida({
        goods_issue_lines: [
          { id: 'gil-1', product_id: 'p-1', quantity: 4, lot_id: 'lot-1', metadata: {} },
        ] as never,
      }),
    );
    await buildService().confirmar(CONTEXT_TENANT_A, 'gi-1');
    expect(inventoryLotRepository.consumir).toHaveBeenCalledWith(CONTEXT_TENANT_A, {
      lotId: 'lot-1',
      productId: 'p-1',
      quantity: 4,
    });
    expect(movimientosService.registrarLote).toHaveBeenCalledWith(
      CONTEXT_TENANT_A,
      expect.arrayContaining([expect.objectContaining({ lotId: 'lot-1', quantity: 4 })]),
    );
  });

  it('crear: rechaza tracks_lot si el lote no alcanza la cantidad solicitada', async () => {
    controlProducto = { tracksLot: true, tracksSerial: false };
    loteExistente = { id: 'lot-1', product_id: 'p-1', remaining_quantity: 2 };
    await expect(
      buildService().crear(CONTEXT_TENANT_A, {
        warehouseId: 'w-1',
        lines: [{ productId: 'p-1', quantity: 5, lotId: 'lot-1' }],
      }),
    ).rejects.toThrow(LoteInvalidoException);
  });

  it('crear: rechaza tracks_lot sin lotId', async () => {
    controlProducto = { tracksLot: true, tracksSerial: false };
    await expect(
      buildService().crear(CONTEXT_TENANT_A, {
        warehouseId: 'w-1',
        lines: [{ productId: 'p-1', quantity: 5 }],
      }),
    ).rejects.toThrow(LoteOSerieRequeridoException);
  });

  // Test de misión #7 (Series): "Issue serial" → la serie queda no disponible
  // (transición atómica in_stock -> issued) y el movimiento OUT la referencia.
  it('confirmar: con línea serializada, emite cada serie y crea un movimiento quantity=1 por cada una', async () => {
    (salidaRepository.obtener as jest.Mock).mockResolvedValue(
      buildSalida({
        goods_issue_lines: [
          {
            id: 'gil-1',
            product_id: 'p-1',
            quantity: 1,
            lot_id: null,
            metadata: { serialNumbers: ['SN-1'] },
          },
        ] as never,
      }),
    );
    await buildService().confirmar(CONTEXT_TENANT_A, 'gi-1');
    expect(inventorySerialRepository.emitir).toHaveBeenCalledWith(CONTEXT_TENANT_A, {
      serialId: 'serial-1',
      productId: 'p-1',
    });
    expect(movimientosService.registrarLote).toHaveBeenCalledWith(
      CONTEXT_TENANT_A,
      expect.arrayContaining([expect.objectContaining({ serialId: 'serial-1', quantity: 1 })]),
    );
  });

  it('crear: rechaza tracks_serial si la serie ya fue emitida', async () => {
    controlProducto = { tracksLot: false, tracksSerial: true };
    serieExistente = { id: 'serial-1', product_id: 'p-1', status: 'issued' };
    await expect(
      buildService().crear(CONTEXT_TENANT_A, {
        warehouseId: 'w-1',
        lines: [{ productId: 'p-1', quantity: 1, serialNumbers: ['SN-1'] }],
      }),
    ).rejects.toThrow(SerieInvalidaException);
  });
});
