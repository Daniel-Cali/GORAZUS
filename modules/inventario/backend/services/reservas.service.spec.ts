import type { UserContext } from '@gorazus/contracts';
import type { stock_reservations, warehouses } from '@gorazus/core-database';
import {
  ReservaStockRepository,
  CapacidadReservaInsuficienteError,
  ReservaYaLiberadaError,
  ReservaNoEncontradaError,
  SerieYaReservadaError,
} from '../repositories/reserva-stock.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import { AlmacenRepository } from '../repositories/almacen.repository';
import { InventoryLotRepository } from '../repositories/inventory-lot.repository';
import { InventorySerialRepository } from '../repositories/inventory-serial.repository';
import {
  ReservasService,
  ReservaNoEncontradaException,
  ReservaYaLiberadaException,
  CapacidadReservaInsuficienteException,
  SerieYaReservadaException,
  SerieInvalidaException,
} from './reservas.service';
import { ProductoInvalidoException, AlmacenInvalidoException } from './movimientos.service';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

const ALMACEN = { id: 'w-1', company_id: 'company-1', branch_id: 'branch-1' } as warehouses;

function baseInput() {
  return {
    productId: 'p-1',
    warehouseId: 'w-1',
    quantity: 10,
    sourceModule: 'ventas',
    sourceEntityId: 'e-1',
  };
}

describe('ReservasService', () => {
  let productoValido: boolean;
  let almacen: warehouses | null;
  let crearError: Error | null;
  let liberarError: Error | null;
  let reservaRepository: ReservaStockRepository;
  let productoLookupRepository: ProductoLookupRepository;
  let almacenRepository: AlmacenRepository;
  let inventoryLotRepository: InventoryLotRepository;
  let inventorySerialRepository: InventorySerialRepository;
  let controlProducto: { tracksLot: boolean; tracksSerial: boolean };

  beforeEach(() => {
    productoValido = true;
    almacen = ALMACEN;
    crearError = null;
    liberarError = null;
    controlProducto = { tracksLot: false, tracksSerial: false };

    reservaRepository = {
      crear: jest.fn(async () => {
        if (crearError) throw crearError;
        return { id: 'r-1' } as stock_reservations;
      }),
      liberar: jest.fn(async () => {
        if (liberarError) throw liberarError;
        return { id: 'r-1', released_at: new Date() } as stock_reservations;
      }),
      obtener: jest.fn(async () => ({ id: 'r-1' }) as stock_reservations),
      listar: jest.fn(async () => ({ data: [], meta: { page: 1, pageSize: 20, total: 0 } })),
    } as unknown as ReservaStockRepository;

    productoLookupRepository = {
      existeProducto: jest.fn(async () => productoValido),
      obtenerControl: jest.fn(async () => controlProducto),
    } as unknown as ProductoLookupRepository;

    almacenRepository = {
      findById: jest.fn(async () => almacen),
    } as unknown as AlmacenRepository;

    inventoryLotRepository = {
      obtenerPorId: jest.fn(async () => ({
        id: 'lot-1',
        product_id: 'p-1',
        remaining_quantity: 10,
      })),
    } as unknown as InventoryLotRepository;

    inventorySerialRepository = {
      obtenerPorNumero: jest.fn(async () => ({
        id: 'serial-1',
        product_id: 'p-1',
        status: 'in_stock',
      })),
    } as unknown as InventorySerialRepository;
  });

  function buildService(): ReservasService {
    return new ReservasService(
      reservaRepository,
      productoLookupRepository,
      almacenRepository,
      inventoryLotRepository,
      inventorySerialRepository,
    );
  }

  it('crear: rechaza cantidad cero (defensa en profundidad de la entidad)', async () => {
    await expect(buildService().crear(CONTEXT, { ...baseInput(), quantity: 0 })).rejects.toThrow(
      'cantidad de una reserva debe ser mayor que cero',
    );
  });

  it('crear: rechaza un producto inexistente', async () => {
    productoValido = false;
    await expect(buildService().crear(CONTEXT, baseInput())).rejects.toThrow(
      ProductoInvalidoException,
    );
  });

  it('crear: rechaza un almacén inexistente', async () => {
    almacen = null;
    await expect(buildService().crear(CONTEXT, baseInput())).rejects.toThrow(
      AlmacenInvalidoException,
    );
  });

  it('crear: traduce CapacidadReservaInsuficienteError del repositorio', async () => {
    crearError = new CapacidadReservaInsuficienteError(3, 10);
    await expect(buildService().crear(CONTEXT, baseInput())).rejects.toThrow(
      CapacidadReservaInsuficienteException,
    );
  });

  it('crear: caso feliz delega al repositorio con companyId/branchId del almacén', async () => {
    const reserva = await buildService().crear(CONTEXT, baseInput());
    expect(reserva.id).toBe('r-1');
    expect(reservaRepository.crear).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ companyId: 'company-1', branchId: 'branch-1', quantity: 10 }),
    );
  });

  it('liberar: traduce ReservaNoEncontradaError', async () => {
    liberarError = new ReservaNoEncontradaError('r-x');
    await expect(buildService().liberar(CONTEXT, 'r-x')).rejects.toThrow(
      ReservaNoEncontradaException,
    );
  });

  it('liberar: traduce ReservaYaLiberadaError', async () => {
    liberarError = new ReservaYaLiberadaError('r-1');
    await expect(buildService().liberar(CONTEXT, 'r-1')).rejects.toThrow(
      ReservaYaLiberadaException,
    );
  });

  it('liberar: caso feliz', async () => {
    const reserva = await buildService().liberar(CONTEXT, 'r-1');
    expect(reserva.released_at).toBeInstanceOf(Date);
  });

  // "Reservation conflicts" (test requirement de misión): "Prevent double
  // reservation of serials" — el repositorio detecta la carrera vía el
  // índice único parcial y lanza SerieYaReservadaError; el servicio lo
  // traduce a excepción de dominio.
  it('crear: rechaza reservar una serie que ya tiene una reserva activa', async () => {
    controlProducto = { tracksLot: false, tracksSerial: true };
    crearError = new SerieYaReservadaError('serial-1');
    await expect(
      buildService().crear(CONTEXT, { ...baseInput(), quantity: 1, serialNumber: 'SN-1' }),
    ).rejects.toThrow(SerieYaReservadaException);
  });

  it('crear: rechaza tracks_serial si la serie no está disponible (ya emitida)', async () => {
    controlProducto = { tracksLot: false, tracksSerial: true };
    (inventorySerialRepository.obtenerPorNumero as jest.Mock).mockResolvedValueOnce({
      id: 'serial-1',
      product_id: 'p-1',
      status: 'issued',
    });
    await expect(
      buildService().crear(CONTEXT, { ...baseInput(), quantity: 1, serialNumber: 'SN-1' }),
    ).rejects.toThrow(SerieInvalidaException);
  });

  it('crear: con tracks_lot, propaga lotId al repositorio', async () => {
    controlProducto = { tracksLot: true, tracksSerial: false };
    await buildService().crear(CONTEXT, { ...baseInput(), lotId: 'lot-1' });
    expect(reservaRepository.crear).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ lotId: 'lot-1' }),
    );
  });
});
