import type { UserContext } from '@gorazus/contracts';
import type { stock_reservations, warehouses } from '@gorazus/core-database';
import {
  ReservaStockRepository,
  CapacidadReservaInsuficienteError,
  ReservaYaLiberadaError,
  ReservaNoEncontradaError,
} from '../repositories/reserva-stock.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import { AlmacenRepository } from '../repositories/almacen.repository';
import {
  ReservasService,
  ReservaNoEncontradaException,
  ReservaYaLiberadaException,
  CapacidadReservaInsuficienteException,
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

  beforeEach(() => {
    productoValido = true;
    almacen = ALMACEN;
    crearError = null;
    liberarError = null;

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
    } as unknown as ProductoLookupRepository;

    almacenRepository = {
      findById: jest.fn(async () => almacen),
    } as unknown as AlmacenRepository;
  });

  function buildService(): ReservasService {
    return new ReservasService(reservaRepository, productoLookupRepository, almacenRepository);
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
});
