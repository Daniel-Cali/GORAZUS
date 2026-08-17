import type { UserContext } from '@gorazus/contracts';
import type {
  stock_transfers,
  stock_movement_types,
  warehouses,
  PaginatedResult,
} from '@gorazus/core-database';
import {
  TransferenciaRepository,
  type TransferenciaConLineas,
} from '../repositories/transferencia.repository';
import { AlmacenRepository } from '../repositories/almacen.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import { TipoMovimientoStockRepository } from '../repositories/tipo-movimiento-stock.repository';
import { InventoryLotRepository } from '../repositories/inventory-lot.repository';
import { InventorySerialRepository } from '../repositories/inventory-serial.repository';
import {
  MovimientosService,
  AlmacenInvalidoException,
  ProductoInvalidoException,
} from './movimientos.service';
import {
  TransferenciasService,
  TransferenciaNoEncontradaException,
  TransicionTransferenciaInvalidaException,
  TipoMovimientoTransferenciaNoConfiguradoException,
  LoteInvalidoException,
  SerieInvalidaException,
} from './transferencias.service';
import type { CrearTransferenciaInput } from '../validators/transferencias.schema';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

const ALMACEN_ORIGEN = { id: 'w-1', company_id: 'company-1', branch_id: 'branch-1' } as warehouses;
const ALMACEN_DESTINO = { id: 'w-2', company_id: 'company-1', branch_id: 'branch-1' } as warehouses;
const TIPO_TRANSFER_OUT = {
  id: 'mt-out',
  code: 'transfer_out',
  direction: 'out',
} as stock_movement_types;
const TIPO_TRANSFER_IN = {
  id: 'mt-in',
  code: 'transfer_in',
  direction: 'in',
} as stock_movement_types;

function buildTransferencia(
  overrides: Partial<TransferenciaConLineas> = {},
): TransferenciaConLineas {
  return {
    id: 't-1',
    source_warehouse_id: 'w-1',
    destination_warehouse_id: 'w-2',
    document_number: 'DOC-1',
    status: 'draft',
    stock_transfer_lines: [{ id: 'l-1', product_id: 'p-1', quantity: 10 } as never],
    ...overrides,
  } as TransferenciaConLineas;
}

function baseInput(): CrearTransferenciaInput {
  return {
    sourceWarehouseId: 'w-1',
    destinationWarehouseId: 'w-2',
    documentNumber: 'DOC-1',
    lines: [{ productId: 'p-1', quantity: 10 }],
  };
}

describe('TransferenciasService', () => {
  let almacenes: Record<string, warehouses | null>;
  let productoValido: boolean;
  let transferencia: TransferenciaConLineas;
  let tiposDisponibles: stock_movement_types[];
  let transferenciaRepository: TransferenciaRepository;
  let almacenRepository: AlmacenRepository;
  let productoLookupRepository: ProductoLookupRepository;
  let tipoMovimientoRepository: TipoMovimientoStockRepository;
  let inventoryLotRepository: InventoryLotRepository;
  let inventorySerialRepository: InventorySerialRepository;
  let movimientosService: MovimientosService;
  let controlProducto: { tracksLot: boolean; tracksSerial: boolean };

  beforeEach(() => {
    almacenes = { 'w-1': ALMACEN_ORIGEN, 'w-2': ALMACEN_DESTINO };
    productoValido = true;
    transferencia = buildTransferencia();
    tiposDisponibles = [TIPO_TRANSFER_OUT, TIPO_TRANSFER_IN];
    controlProducto = { tracksLot: false, tracksSerial: false };

    transferenciaRepository = {
      crear: jest.fn(async () => transferencia),
      obtener: jest.fn(async () => transferencia),
      listar: jest.fn(async () => ({ data: [], meta: { page: 1, pageSize: 20, total: 0 } })),
      actualizarEstado: jest.fn(async (_ctx: unknown, _id: string, status: string) => {
        transferencia = { ...transferencia, status } as TransferenciaConLineas;
        return transferencia as unknown as stock_transfers;
      }),
    } as unknown as TransferenciaRepository;

    almacenRepository = {
      findById: jest.fn(
        async (_ctx: unknown, where: { id: string }) => almacenes[where.id] ?? null,
      ),
    } as unknown as AlmacenRepository;

    productoLookupRepository = {
      existeProducto: jest.fn(async () => productoValido),
      obtenerControl: jest.fn(async () => controlProducto),
    } as unknown as ProductoLookupRepository;

    inventoryLotRepository = {
      obtenerPorId: jest.fn(async () => ({
        id: 'lot-1',
        product_id: 'p-1',
        warehouse_id: 'w-1',
        remaining_quantity: 10,
      })),
      moverAlmacen: jest.fn(async () => ({ id: 'lot-1' })),
    } as unknown as InventoryLotRepository;

    inventorySerialRepository = {
      obtenerPorNumero: jest.fn(async () => ({
        id: 'serial-1',
        product_id: 'p-1',
        warehouse_id: 'w-1',
        status: 'in_stock',
      })),
      moverAlmacen: jest.fn(async () => ({ id: 'serial-1' })),
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

    movimientosService = {
      registrarLote: jest.fn(async () => []),
    } as unknown as MovimientosService;
  });

  function buildService(): TransferenciasService {
    return new TransferenciasService(
      transferenciaRepository,
      almacenRepository,
      productoLookupRepository,
      tipoMovimientoRepository,
      inventoryLotRepository,
      inventorySerialRepository,
      movimientosService,
    );
  }

  it('crear: rechaza almacén de origen y destino iguales (defensa en profundidad de la entidad)', async () => {
    await expect(
      buildService().crear(CONTEXT, { ...baseInput(), destinationWarehouseId: 'w-1' }),
    ).rejects.toThrow('no pueden ser el mismo');
  });

  it('crear: rechaza almacén de origen inexistente', async () => {
    almacenes['w-1'] = null;
    await expect(buildService().crear(CONTEXT, baseInput())).rejects.toThrow(
      AlmacenInvalidoException,
    );
  });

  it('crear: rechaza almacén de destino inexistente', async () => {
    almacenes['w-2'] = null;
    await expect(buildService().crear(CONTEXT, baseInput())).rejects.toThrow(
      AlmacenInvalidoException,
    );
  });

  it('crear: rechaza un producto de línea inexistente', async () => {
    productoValido = false;
    await expect(buildService().crear(CONTEXT, baseInput())).rejects.toThrow(
      ProductoInvalidoException,
    );
  });

  it('crear: caso feliz delega al repositorio con companyId/branchId del almacén origen', async () => {
    await buildService().crear(CONTEXT, baseInput());
    expect(transferenciaRepository.crear).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ companyId: 'company-1', branchId: 'branch-1' }),
    );
  });

  it('obtener: transferencia inexistente lanza TransferenciaNoEncontradaException', async () => {
    (transferenciaRepository.obtener as jest.Mock).mockResolvedValueOnce(null);
    await expect(buildService().obtener(CONTEXT, 't-x')).rejects.toThrow(
      TransferenciaNoEncontradaException,
    );
  });

  it('iniciar: rechaza si el estado no es draft', async () => {
    transferencia = buildTransferencia({ status: 'received' });
    (transferenciaRepository.obtener as jest.Mock).mockResolvedValueOnce(transferencia);
    await expect(buildService().iniciar(CONTEXT, 't-1')).rejects.toThrow(
      TransicionTransferenciaInvalidaException,
    );
  });

  it('iniciar: rechaza si no existe el tipo de movimiento transfer_out configurado', async () => {
    tiposDisponibles = [TIPO_TRANSFER_IN];
    await expect(buildService().iniciar(CONTEXT, 't-1')).rejects.toThrow(
      TipoMovimientoTransferenciaNoConfiguradoException,
    );
  });

  it('iniciar: caso feliz genera un lote de transfer_out en el almacén origen y pasa a in_transit', async () => {
    const resultado = await buildService().iniciar(CONTEXT, 't-1');
    expect(movimientosService.registrarLote).toHaveBeenCalledWith(
      CONTEXT,
      expect.arrayContaining([
        expect.objectContaining({
          productId: 'p-1',
          warehouseId: 'w-1',
          movementTypeId: 'mt-out',
          quantity: 10,
          sourceModule: 'inventario.transferencias',
          sourceEntityId: 't-1',
        }),
      ]),
    );
    expect(resultado.status).toBe('in_transit');
  });

  it('recibir: rechaza si el estado no es in_transit', async () => {
    await expect(buildService().recibir(CONTEXT, 't-1')).rejects.toThrow(
      TransicionTransferenciaInvalidaException,
    );
  });

  it('recibir: caso feliz genera un lote de transfer_in en el almacén destino y pasa a received', async () => {
    transferencia = buildTransferencia({ status: 'in_transit' });
    (transferenciaRepository.obtener as jest.Mock).mockResolvedValue(transferencia);
    const resultado = await buildService().recibir(CONTEXT, 't-1');
    expect(movimientosService.registrarLote).toHaveBeenCalledWith(
      CONTEXT,
      expect.arrayContaining([
        expect.objectContaining({ productId: 'p-1', warehouseId: 'w-2', movementTypeId: 'mt-in' }),
      ]),
    );
    expect(resultado.status).toBe('received');
  });

  it('cancelar: rechaza si el estado no es draft', async () => {
    transferencia = buildTransferencia({ status: 'in_transit' });
    (transferenciaRepository.obtener as jest.Mock).mockResolvedValue(transferencia);
    await expect(buildService().cancelar(CONTEXT, 't-1')).rejects.toThrow(
      TransicionTransferenciaInvalidaException,
    );
  });

  it('cancelar: caso feliz desde draft', async () => {
    const resultado = await buildService().cancelar(CONTEXT, 't-1');
    expect(resultado.status).toBe('cancelled');
    expect(movimientosService.registrarLote).not.toHaveBeenCalled();
  });

  // "Transfers with lots" (test requirement de misión): el movimiento IN
  // referencia el mismo lotId; al recibir la cantidad COMPLETA del lote,
  // se reasigna warehouse_id al destino.
  it('recibir: con línea de lote (transferencia completa), reasigna el almacén del lote', async () => {
    transferencia = buildTransferencia({
      status: 'in_transit',
      stock_transfer_lines: [
        { id: 'l-1', product_id: 'p-1', quantity: 10, lot_id: 'lot-1', metadata: {} } as never,
      ],
    });
    (transferenciaRepository.obtener as jest.Mock).mockResolvedValue(transferencia);
    await buildService().recibir(CONTEXT, 't-1');
    expect(inventoryLotRepository.moverAlmacen).toHaveBeenCalledWith(CONTEXT, {
      lotId: 'lot-1',
      warehouseId: 'w-2',
    });
    expect(movimientosService.registrarLote).toHaveBeenCalledWith(
      CONTEXT,
      expect.arrayContaining([expect.objectContaining({ lotId: 'lot-1', warehouseId: 'w-2' })]),
    );
  });

  it('crear: rechaza tracks_lot si el lote no está en el almacén de origen', async () => {
    controlProducto = { tracksLot: true, tracksSerial: false };
    (inventoryLotRepository.obtenerPorId as jest.Mock).mockResolvedValueOnce({
      id: 'lot-1',
      product_id: 'p-1',
      warehouse_id: 'w-2',
      remaining_quantity: 10,
    });
    await expect(
      buildService().crear(CONTEXT, {
        ...baseInput(),
        lines: [{ productId: 'p-1', quantity: 10, lotId: 'lot-1' }],
      }),
    ).rejects.toThrow(LoteInvalidoException);
  });

  // "Transfers with serials" (test requirement de misión): un movimiento
  // OUT/IN por serie (quantity=1), y al recibir se reasigna warehouse_id.
  it('recibir: con línea serializada, reasigna el almacén de cada serie', async () => {
    transferencia = buildTransferencia({
      status: 'in_transit',
      stock_transfer_lines: [
        {
          id: 'l-1',
          product_id: 'p-1',
          quantity: 1,
          lot_id: null,
          metadata: { serialNumbers: ['SN-1'] },
        } as never,
      ],
    });
    (transferenciaRepository.obtener as jest.Mock).mockResolvedValue(transferencia);
    await buildService().recibir(CONTEXT, 't-1');
    expect(inventorySerialRepository.moverAlmacen).toHaveBeenCalledWith(CONTEXT, {
      serialId: 'serial-1',
      warehouseId: 'w-2',
    });
    expect(movimientosService.registrarLote).toHaveBeenCalledWith(
      CONTEXT,
      expect.arrayContaining([
        expect.objectContaining({ serialId: 'serial-1', warehouseId: 'w-2', quantity: 1 }),
      ]),
    );
  });

  it('crear: rechaza tracks_serial si la serie no está disponible (ya emitida)', async () => {
    controlProducto = { tracksLot: false, tracksSerial: true };
    (inventorySerialRepository.obtenerPorNumero as jest.Mock).mockResolvedValueOnce({
      id: 'serial-1',
      product_id: 'p-1',
      warehouse_id: 'w-1',
      status: 'issued',
    });
    await expect(
      buildService().crear(CONTEXT, {
        ...baseInput(),
        lines: [{ productId: 'p-1', quantity: 1, serialNumbers: ['SN-1'] }],
      }),
    ).rejects.toThrow(SerieInvalidaException);
  });
});
