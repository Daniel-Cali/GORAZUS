import type { UserContext } from '@gorazus/contracts';
import type { warehouses, stock_movements } from '@gorazus/core-database';
import {
  GoodsReceiptRepository,
  type RecepcionInventarioConLineas,
} from '../repositories/goods-receipt.repository';
import { AlmacenRepository } from '../repositories/almacen.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import { TipoMovimientoStockRepository } from '../repositories/tipo-movimiento-stock.repository';
import { InventoryLotRepository } from '../repositories/inventory-lot.repository';
import { InventorySerialRepository } from '../repositories/inventory-serial.repository';
import { MovimientosService } from './movimientos.service';
import { CosteoService } from './costeo.service';
import {
  RecepcionesInventarioService,
  RecepcionInventarioInvalidaException,
  RecepcionYaConfirmadaException,
  LoteOSerieRequeridoException,
  SerieDuplicadaException,
} from './recepciones-inventario.service';
import { SerieInvalidaError } from '../repositories/inventory-serial.repository';
import type { CrearRecepcionInventarioInput } from '../validators/recepciones-inventario.schema';

const CONTEXT_TENANT_A: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-A',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

const ALMACEN = { id: 'w-1', company_id: 'company-1', branch_id: 'branch-1' } as warehouses;
const TIPO_RECEPCION = { id: 'mt-receipt', code: 'receipt', direction: 'in' };

function buildRecepcion(
  overrides: Partial<RecepcionInventarioConLineas> = {},
): RecepcionInventarioConLineas {
  return {
    id: 'gr-1',
    tenant_id: 'tenant-A',
    company_id: 'company-1',
    branch_id: 'branch-1',
    warehouse_id: 'w-1',
    deleted_at: null,
    goods_receipt_lines: [{ id: 'grl-1', product_id: 'p-1', quantity: 10, unit_cost: 5 }],
    ...overrides,
  } as unknown as RecepcionInventarioConLineas;
}

describe('RecepcionesInventarioService', () => {
  let almacen: warehouses | null;
  let productoValido: boolean;
  let movimientosExistentes: number;
  let recepcionRepository: GoodsReceiptRepository;
  let almacenRepository: AlmacenRepository;
  let productoLookupRepository: ProductoLookupRepository;
  let tipoMovimientoRepository: TipoMovimientoStockRepository;
  let inventoryLotRepository: InventoryLotRepository;
  let inventorySerialRepository: InventorySerialRepository;
  let movimientosService: MovimientosService;
  let costeoService: CosteoService;
  let controlProducto: { tracksLot: boolean; tracksSerial: boolean };

  beforeEach(() => {
    almacen = ALMACEN;
    productoValido = true;
    movimientosExistentes = 0;
    controlProducto = { tracksLot: false, tracksSerial: false };

    recepcionRepository = {
      crear: jest.fn(async () => buildRecepcion()),
      obtener: jest.fn(async () => buildRecepcion()),
      listar: jest.fn(async () => ({ data: [], meta: { page: 1, pageSize: 20, total: 0 } })),
      anular: jest.fn(async () => ({ ...buildRecepcion(), deleted_at: new Date() })),
    } as unknown as GoodsReceiptRepository;

    almacenRepository = {
      findById: jest.fn(async () => almacen),
    } as unknown as AlmacenRepository;

    productoLookupRepository = {
      existeProducto: jest.fn(async () => productoValido),
      obtenerControl: jest.fn(async () => controlProducto),
    } as unknown as ProductoLookupRepository;

    tipoMovimientoRepository = {
      findMany: jest.fn(async () => ({
        data: [TIPO_RECEPCION],
        meta: { page: 1, pageSize: 1, total: 1 },
      })),
    } as unknown as TipoMovimientoStockRepository;

    inventoryLotRepository = {
      crearOIncrementar: jest.fn(async () => ({ id: 'lot-1', remaining_quantity: 0 })),
      incrementar: jest.fn(async () => ({ id: 'lot-1', remaining_quantity: 10 })),
    } as unknown as InventoryLotRepository;

    inventorySerialRepository = {
      crear: jest.fn(async (_ctx: unknown, params: { serialNumber: string }) => ({
        id: `serial-${params.serialNumber}`,
        serial_number: params.serialNumber,
      })),
    } as unknown as InventorySerialRepository;

    movimientosService = {
      registrarLote: jest.fn(async (_ctx: unknown, items: unknown[]) =>
        items.map((_, i) => ({
          movimiento: { id: `mv-${i}` } as stock_movements,
          stockActualizado: {} as never,
        })),
      ),
      listar: jest.fn(async () => ({
        data: [],
        meta: { page: 1, pageSize: 1, total: movimientosExistentes },
      })),
    } as unknown as MovimientosService;

    costeoService = {
      registrarEntrada: jest.fn(async () => ({
        costingMethod: 'fifo',
        layerId: 'cl-1',
        newAverageCost: null,
      })),
    } as unknown as CosteoService;
  });

  function buildService(): RecepcionesInventarioService {
    return new RecepcionesInventarioService(
      recepcionRepository,
      almacenRepository,
      productoLookupRepository,
      tipoMovimientoRepository,
      inventoryLotRepository,
      inventorySerialRepository,
      movimientosService,
      costeoService,
    );
  }

  const inputBase: CrearRecepcionInventarioInput = {
    warehouseId: 'w-1',
    lines: [{ productId: 'p-1', quantity: 10, unitCost: 5 }],
  };

  // Caso 1: crear borrador — sin movimiento de stock.
  it('crear: registra la recepción en borrador, sin tocar movimientos', async () => {
    const resultado = await buildService().crear(CONTEXT_TENANT_A, inputBase);
    expect(resultado.estado).toBe('borrador');
    expect(movimientosService.registrarLote).not.toHaveBeenCalled();
    expect(recepcionRepository.crear).toHaveBeenCalledWith(
      CONTEXT_TENANT_A,
      expect.objectContaining({ warehouseId: 'w-1' }),
    );
  });

  // Caso 2: confirmar — estado confirmada, movimiento creado, costeo aplicado.
  it('confirmar: crea movimiento por línea, aplica costeo, devuelve estado confirmada', async () => {
    const resultado = await buildService().confirmar(CONTEXT_TENANT_A, 'gr-1');
    expect(resultado.estado).toBe('confirmada');
    expect(movimientosService.registrarLote).toHaveBeenCalledWith(
      CONTEXT_TENANT_A,
      expect.arrayContaining([
        expect.objectContaining({
          productId: 'p-1',
          warehouseId: 'w-1',
          movementTypeId: 'mt-receipt',
        }),
      ]),
    );
    expect(costeoService.registrarEntrada).toHaveBeenCalledWith(
      CONTEXT_TENANT_A,
      expect.objectContaining({ productId: 'p-1', unitCost: 5, sourceReceiptLineId: 'grl-1' }),
    );
  });

  // Caso 3: doble confirmación — rechazada.
  it('confirmar: rechaza una segunda confirmación (ya existen movimientos)', async () => {
    movimientosExistentes = 1; // simula que el primer confirmar ya corrió
    await expect(buildService().confirmar(CONTEXT_TENANT_A, 'gr-1')).rejects.toThrow(
      RecepcionYaConfirmadaException,
    );
    expect(movimientosService.registrarLote).not.toHaveBeenCalled();
  });

  // Caso 4: cantidad inválida — error de validación (invariante de entidad).
  it('crear: rechaza cantidad cero (invariante de la entidad)', async () => {
    await expect(
      buildService().crear(CONTEXT_TENANT_A, {
        warehouseId: 'w-1',
        lines: [{ productId: 'p-1', quantity: 0, unitCost: 5 }],
      }),
    ).rejects.toThrow(RecepcionInventarioInvalidaException);
    expect(recepcionRepository.crear).not.toHaveBeenCalled();
  });

  // Caso 5: aislamiento de tenant — el servicio propaga el UserContext real
  // al repositorio en cada llamada; la exclusión cruzada de tenant en sí la
  // aplica Postgres RLS + `withTenantScope` (no verificable con un mock,
  // requiere Postgres real — ver test e2e pendiente, Docker inactivo aquí).
  it('obtener: propaga el tenantId del contexto real al repositorio (no asume uno fijo)', async () => {
    const contextTenantB: UserContext = { ...CONTEXT_TENANT_A, tenantId: 'tenant-B' };
    await buildService().obtener(contextTenantB, 'gr-1');
    expect(recepcionRepository.obtener).toHaveBeenCalledWith(contextTenantB, 'gr-1');
  });

  // Test de misión #1 (Lotes): "Create lot during receiving" → lote resuelto (find-or-create,
  // quantity 0 en el borrador) y linkeado a la línea.
  it('crear: con producto tracks_lot, resuelve el lote y lo linkea a la línea', async () => {
    controlProducto = { tracksLot: true, tracksSerial: false };
    await buildService().crear(CONTEXT_TENANT_A, {
      warehouseId: 'w-1',
      lines: [{ productId: 'p-1', quantity: 10, unitCost: 5, lotNumber: 'LOT-2026-001' }],
    });
    expect(inventoryLotRepository.crearOIncrementar).toHaveBeenCalledWith(
      CONTEXT_TENANT_A,
      expect.objectContaining({ productId: 'p-1', lotNumber: 'LOT-2026-001', quantity: 0 }),
    );
    expect(recepcionRepository.crear).toHaveBeenCalledWith(
      CONTEXT_TENANT_A,
      expect.objectContaining({ lines: [expect.objectContaining({ lotId: 'lot-1' })] }),
    );
  });

  it('crear: rechaza tracks_lot sin lotNumber', async () => {
    controlProducto = { tracksLot: true, tracksSerial: false };
    await expect(
      buildService().crear(CONTEXT_TENANT_A, {
        warehouseId: 'w-1',
        lines: [{ productId: 'p-1', quantity: 10, unitCost: 5 }],
      }),
    ).rejects.toThrow(LoteOSerieRequeridoException);
    expect(recepcionRepository.crear).not.toHaveBeenCalled();
  });

  // Test de misión #5 (Series): "Create serial during receipt" → cada número de serie se
  // captura en la línea (se crean como `inventory_serials` recién en confirmar()).
  it('crear: con producto tracks_serial, exige tantos números de serie como la cantidad', async () => {
    controlProducto = { tracksLot: false, tracksSerial: true };
    await buildService().crear(CONTEXT_TENANT_A, {
      warehouseId: 'w-1',
      lines: [{ productId: 'p-1', quantity: 2, serialNumbers: ['SN-1', 'SN-2'] }],
    });
    expect(recepcionRepository.crear).toHaveBeenCalledWith(
      CONTEXT_TENANT_A,
      expect.objectContaining({
        lines: [expect.objectContaining({ serialNumbers: ['SN-1', 'SN-2'] })],
      }),
    );
  });

  it('confirmar: con línea de lote, incrementa remaining_quantity y crea el movimiento con lotId', async () => {
    (recepcionRepository.obtener as jest.Mock).mockResolvedValue(
      buildRecepcion({
        goods_receipt_lines: [
          {
            id: 'grl-1',
            product_id: 'p-1',
            quantity: 10,
            unit_cost: 5,
            lot_id: 'lot-1',
            metadata: {},
          },
        ] as never,
      }),
    );
    await buildService().confirmar(CONTEXT_TENANT_A, 'gr-1');
    expect(inventoryLotRepository.incrementar).toHaveBeenCalledWith(CONTEXT_TENANT_A, {
      lotId: 'lot-1',
      quantity: 10,
    });
    expect(movimientosService.registrarLote).toHaveBeenCalledWith(
      CONTEXT_TENANT_A,
      expect.arrayContaining([expect.objectContaining({ lotId: 'lot-1', quantity: 10 })]),
    );
  });

  it('confirmar: con línea serializada, crea una serie por número y un movimiento quantity=1 cada uno', async () => {
    (recepcionRepository.obtener as jest.Mock).mockResolvedValue(
      buildRecepcion({
        goods_receipt_lines: [
          {
            id: 'grl-1',
            product_id: 'p-1',
            quantity: 2,
            unit_cost: 5,
            lot_id: null,
            metadata: { serialNumbers: ['SN-1', 'SN-2'] },
          },
        ] as never,
      }),
    );
    await buildService().confirmar(CONTEXT_TENANT_A, 'gr-1');
    expect(inventorySerialRepository.crear).toHaveBeenCalledTimes(2);
    expect(movimientosService.registrarLote).toHaveBeenCalledWith(
      CONTEXT_TENANT_A,
      expect.arrayContaining([
        expect.objectContaining({ serialId: 'serial-SN-1', quantity: 1 }),
        expect.objectContaining({ serialId: 'serial-SN-2', quantity: 1 }),
      ]),
    );
  });

  // Test de misión #6 (Series): "Duplicate serial → Rejected" — el índice único
  // `uq_inventory_inventory_serials_identity` rechaza en el repositorio
  // (P2002 -> SerieInvalidaError('duplicada')); el servicio lo traduce a una
  // excepción de dominio en vez de dejarlo escapar sin traducir.
  it('confirmar: rechaza un número de serie ya existente (duplicado)', async () => {
    (inventorySerialRepository.crear as jest.Mock).mockRejectedValueOnce(
      new SerieInvalidaError('duplicada'),
    );
    (recepcionRepository.obtener as jest.Mock).mockResolvedValue(
      buildRecepcion({
        goods_receipt_lines: [
          {
            id: 'grl-1',
            product_id: 'p-1',
            quantity: 1,
            unit_cost: 5,
            lot_id: null,
            metadata: { serialNumbers: ['SN-1'] },
          },
        ] as never,
      }),
    );
    await expect(buildService().confirmar(CONTEXT_TENANT_A, 'gr-1')).rejects.toThrow(
      SerieDuplicadaException,
    );
  });
});
