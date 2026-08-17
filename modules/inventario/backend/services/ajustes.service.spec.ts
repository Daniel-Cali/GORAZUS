import type { UserContext } from '@gorazus/contracts';
import type {
  stock_adjustments,
  stock_adjustment_reasons,
  stock_movement_types,
  warehouses,
  PaginatedResult,
} from '@gorazus/core-database';
import {
  AjusteStockRepository,
  type AjusteConLineas,
} from '../repositories/ajuste-stock.repository';
import { AlmacenRepository } from '../repositories/almacen.repository';
import { MotivoAjusteRepository } from '../repositories/motivo-ajuste.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import { TipoMovimientoStockRepository } from '../repositories/tipo-movimiento-stock.repository';
import { InventoryLotRepository } from '../repositories/inventory-lot.repository';
import { InventorySerialRepository } from '../repositories/inventory-serial.repository';
import { StockService } from './stock.service';
import {
  MovimientosService,
  AlmacenInvalidoException,
  ProductoInvalidoException,
} from './movimientos.service';
import {
  AjustesService,
  AjusteNoEncontradoException,
  MotivoAjusteInvalidoException,
  AjusteYaConfirmadoException,
  TipoMovimientoAjusteNoConfiguradoException,
  LoteOSerieRequeridoException,
} from './ajustes.service';
import type { CrearAjusteInput } from '../validators/ajustes.schema';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

const ALMACEN = { id: 'w-1', company_id: 'company-1', branch_id: 'branch-1' } as warehouses;
const MOTIVO = { id: 'r-1', name: 'Diferencia de Conteo' } as stock_adjustment_reasons;
const TIPO_INCREMENTO = {
  id: 'mt-inc',
  code: 'adjustment_increase',
  direction: 'in',
} as stock_movement_types;
const TIPO_DECREMENTO = {
  id: 'mt-dec',
  code: 'adjustment_decrease',
  direction: 'out',
} as stock_movement_types;

function buildAjuste(overrides: Partial<AjusteConLineas> = {}): AjusteConLineas {
  return {
    id: 'a-1',
    warehouse_id: 'w-1',
    reason_id: 'r-1',
    status: 'draft',
    stock_adjustment_lines: [
      { id: 'l-1', product_id: 'p-1', previous_quantity: 10, new_quantity: 8 } as never,
    ],
    ...overrides,
  } as AjusteConLineas;
}

function baseInput(): CrearAjusteInput {
  return {
    warehouseId: 'w-1',
    reasonId: 'r-1',
    lines: [{ productId: 'p-1', newQuantity: 8 }],
  };
}

describe('AjustesService', () => {
  let almacen: warehouses | null;
  let motivo: stock_adjustment_reasons | null;
  let productoValido: boolean;
  let quantityOnHand: number;
  let ajuste: AjusteConLineas;
  let tiposDisponibles: stock_movement_types[];
  let ajusteRepository: AjusteStockRepository;
  let almacenRepository: AlmacenRepository;
  let motivoAjusteRepository: MotivoAjusteRepository;
  let productoLookupRepository: ProductoLookupRepository;
  let tipoMovimientoRepository: TipoMovimientoStockRepository;
  let inventoryLotRepository: InventoryLotRepository;
  let inventorySerialRepository: InventorySerialRepository;
  let stockService: StockService;
  let movimientosService: MovimientosService;
  let controlProducto: { tracksLot: boolean; tracksSerial: boolean };

  beforeEach(() => {
    almacen = ALMACEN;
    motivo = MOTIVO;
    productoValido = true;
    quantityOnHand = 10;
    ajuste = buildAjuste();
    tiposDisponibles = [TIPO_INCREMENTO, TIPO_DECREMENTO];
    controlProducto = { tracksLot: false, tracksSerial: false };

    ajusteRepository = {
      crear: jest.fn(async () => ajuste),
      obtener: jest.fn(async () => ajuste),
      listar: jest.fn(async () => ({ data: [], meta: { page: 1, pageSize: 20, total: 0 } })),
      confirmar: jest.fn(async () => ({ ...ajuste, status: 'confirmed' }) as stock_adjustments),
    } as unknown as AjusteStockRepository;

    almacenRepository = { findById: jest.fn(async () => almacen) } as unknown as AlmacenRepository;
    motivoAjusteRepository = {
      findById: jest.fn(async () => motivo),
    } as unknown as MotivoAjusteRepository;
    productoLookupRepository = {
      existeProducto: jest.fn(async () => productoValido),
      obtenerControl: jest.fn(async () => controlProducto),
    } as unknown as ProductoLookupRepository;
    inventoryLotRepository = {
      obtenerPorId: jest.fn(async () => ({
        id: 'lot-1',
        product_id: 'p-1',
        remaining_quantity: 10,
      })),
      incrementar: jest.fn(async () => ({ id: 'lot-1' })),
      consumir: jest.fn(async () => ({ id: 'lot-1' })),
    } as unknown as InventoryLotRepository;
    inventorySerialRepository = {
      obtenerPorNumero: jest.fn(async () => ({
        id: 'serial-1',
        product_id: 'p-1',
        status: 'in_stock',
      })),
      devolverStock: jest.fn(async () => ({ id: 'serial-1' })),
      emitir: jest.fn(async () => ({ id: 'serial-1' })),
    } as unknown as InventorySerialRepository;
    tipoMovimientoRepository = {
      findMany: jest.fn(async (_ctx: unknown, filter: { code?: string }) => {
        const data = tiposDisponibles.filter((t) => !filter.code || t.code === filter.code);
        return {
          data,
          meta: { page: 1, pageSize: 1, total: data.length },
        } as PaginatedResult<stock_movement_types>;
      }),
    } as unknown as TipoMovimientoStockRepository;
    stockService = {
      obtenerDisponible: jest.fn(async () => ({
        productId: 'p-1',
        warehouseId: 'w-1',
        locationId: null,
        quantityOnHand,
        quantityReserved: 0,
        quantityAvailable: quantityOnHand,
      })),
    } as unknown as StockService;
    movimientosService = {
      registrarLote: jest.fn(async () => []),
    } as unknown as MovimientosService;
  });

  function buildService(): AjustesService {
    return new AjustesService(
      ajusteRepository,
      almacenRepository,
      motivoAjusteRepository,
      productoLookupRepository,
      tipoMovimientoRepository,
      inventoryLotRepository,
      inventorySerialRepository,
      stockService,
      movimientosService,
    );
  }

  it('crear: rechaza un almacén inexistente', async () => {
    almacen = null;
    await expect(buildService().crear(CONTEXT, baseInput())).rejects.toThrow(
      AlmacenInvalidoException,
    );
  });

  it('crear: rechaza un motivo inexistente', async () => {
    motivo = null;
    await expect(buildService().crear(CONTEXT, baseInput())).rejects.toThrow(
      MotivoAjusteInvalidoException,
    );
  });

  it('crear: rechaza un producto de línea inexistente', async () => {
    productoValido = false;
    await expect(buildService().crear(CONTEXT, baseInput())).rejects.toThrow(
      ProductoInvalidoException,
    );
  });

  it('crear: resuelve previousQuantity del stock real', async () => {
    quantityOnHand = 25;
    await buildService().crear(CONTEXT, baseInput());
    expect(ajusteRepository.crear).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({
        lines: [expect.objectContaining({ previousQuantity: 25, newQuantity: 8 })],
      }),
    );
  });

  it('obtener: ajuste inexistente lanza AjusteNoEncontradoException', async () => {
    (ajusteRepository.obtener as jest.Mock).mockResolvedValueOnce(null);
    await expect(buildService().obtener(CONTEXT, 'a-x')).rejects.toThrow(
      AjusteNoEncontradoException,
    );
  });

  it('confirmar: rechaza si ya está confirmado', async () => {
    ajuste = buildAjuste({ status: 'confirmed' });
    (ajusteRepository.obtener as jest.Mock).mockResolvedValueOnce(ajuste);
    await expect(buildService().confirmar(CONTEXT, 'a-1')).rejects.toThrow(
      AjusteYaConfirmadoException,
    );
  });

  it('confirmar: sin diferencia entre líneas no genera movimientos', async () => {
    ajuste = buildAjuste({
      stock_adjustment_lines: [
        { id: 'l-1', product_id: 'p-1', previous_quantity: 10, new_quantity: 10 } as never,
      ],
    });
    (ajusteRepository.obtener as jest.Mock).mockResolvedValueOnce(ajuste);
    await buildService().confirmar(CONTEXT, 'a-1');
    expect(movimientosService.registrarLote).not.toHaveBeenCalled();
    expect(ajusteRepository.confirmar).toHaveBeenCalledWith(CONTEXT, 'a-1');
  });

  it('confirmar: genera adjustment_decrease para una línea que bajó', async () => {
    await buildService().confirmar(CONTEXT, 'a-1');
    expect(movimientosService.registrarLote).toHaveBeenCalledWith(
      CONTEXT,
      expect.arrayContaining([
        expect.objectContaining({
          productId: 'p-1',
          warehouseId: 'w-1',
          movementTypeId: 'mt-dec',
          quantity: 2,
          sourceModule: 'inventario.ajustes',
          sourceEntityId: 'a-1',
        }),
      ]),
    );
  });

  it('confirmar: genera adjustment_increase para una línea que subió', async () => {
    ajuste = buildAjuste({
      stock_adjustment_lines: [
        { id: 'l-1', product_id: 'p-1', previous_quantity: 10, new_quantity: 15 } as never,
      ],
    });
    (ajusteRepository.obtener as jest.Mock).mockResolvedValueOnce(ajuste);
    await buildService().confirmar(CONTEXT, 'a-1');
    expect(movimientosService.registrarLote).toHaveBeenCalledWith(
      CONTEXT,
      expect.arrayContaining([expect.objectContaining({ movementTypeId: 'mt-inc', quantity: 5 })]),
    );
  });

  it('confirmar: rechaza si no existe el tipo de movimiento configurado', async () => {
    tiposDisponibles = [];
    await expect(buildService().confirmar(CONTEXT, 'a-1')).rejects.toThrow(
      TipoMovimientoAjusteNoConfiguradoException,
    );
  });

  it('listar: delega al repositorio', async () => {
    const resultado = await buildService().listar(CONTEXT, {}, { page: 1, pageSize: 20 });
    expect(resultado.meta.total).toBe(0);
  });

  // "Adjustments with lots" (test requirement de misión): decremento
  // atómico del lote (Loss/Damage/Correction hacia abajo) + movimiento con lotId.
  it('confirmar: con línea de lote a la baja, consume el lote y crea el movimiento con lotId', async () => {
    ajuste = buildAjuste({
      stock_adjustment_lines: [
        {
          id: 'l-1',
          product_id: 'p-1',
          previous_quantity: 10,
          new_quantity: 8,
          lot_id: 'lot-1',
          metadata: {},
        } as never,
      ],
    });
    (ajusteRepository.obtener as jest.Mock).mockResolvedValueOnce(ajuste);
    await buildService().confirmar(CONTEXT, 'a-1');
    expect(inventoryLotRepository.consumir).toHaveBeenCalledWith(CONTEXT, {
      lotId: 'lot-1',
      productId: 'p-1',
      quantity: 2,
    });
    expect(movimientosService.registrarLote).toHaveBeenCalledWith(
      CONTEXT,
      expect.arrayContaining([expect.objectContaining({ lotId: 'lot-1', quantity: 2 })]),
    );
  });

  it('crear: rechaza tracks_lot sin lotId', async () => {
    controlProducto = { tracksLot: true, tracksSerial: false };
    await expect(buildService().crear(CONTEXT, baseInput())).rejects.toThrow(
      LoteOSerieRequeridoException,
    );
  });

  // "Adjustments with serials" (test requirement de misión): un ajuste a la
  // baja (Loss) emite la serie; un movimiento quantity=1 con serialId.
  it('confirmar: con línea serializada a la baja, emite la serie y crea el movimiento con serialId', async () => {
    ajuste = buildAjuste({
      stock_adjustment_lines: [
        {
          id: 'l-1',
          product_id: 'p-1',
          previous_quantity: 1,
          new_quantity: 0,
          lot_id: null,
          metadata: { serialNumbers: ['SN-1'] },
        } as never,
      ],
    });
    (ajusteRepository.obtener as jest.Mock).mockResolvedValueOnce(ajuste);
    await buildService().confirmar(CONTEXT, 'a-1');
    expect(inventorySerialRepository.emitir).toHaveBeenCalledWith(CONTEXT, {
      serialId: 'serial-1',
      productId: 'p-1',
    });
    expect(movimientosService.registrarLote).toHaveBeenCalledWith(
      CONTEXT,
      expect.arrayContaining([expect.objectContaining({ serialId: 'serial-1', quantity: 1 })]),
    );
  });
});
