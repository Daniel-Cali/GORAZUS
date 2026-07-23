import type { UserContext } from '@gorazus/contracts';
import type {
  stock_movement_types,
  stock_movements,
  warehouses,
  warehouse_locations,
} from '@gorazus/core-database';
import {
  MovimientoStockRepository,
  StockInsuficienteError,
} from '../repositories/movimiento-stock.repository';
import { TipoMovimientoStockRepository } from '../repositories/tipo-movimiento-stock.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import { AlmacenRepository } from '../repositories/almacen.repository';
import { UbicacionAlmacenRepository } from '../repositories/ubicacion-almacen.repository';
import {
  MovimientosService,
  ProductoInvalidoException,
  AlmacenInvalidoException,
  UbicacionInvalidaException,
  TipoMovimientoInvalidoException,
  StockInsuficienteException,
} from './movimientos.service';
import type { RegistrarMovimientoInput } from '../validators/movimientos.schema';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

const TIPO_ENTRADA = {
  id: 'mt-in',
  tenant_id: 'tenant-1',
  code: 'receipt',
  direction: 'in',
} as stock_movement_types;
const TIPO_SALIDA = {
  id: 'mt-out',
  tenant_id: 'tenant-1',
  code: 'issue',
  direction: 'out',
} as stock_movement_types;
const ALMACEN = { id: 'w-1', company_id: 'company-1', branch_id: 'branch-1' } as warehouses;
const UBICACION = { id: 'loc-1' } as warehouse_locations;

function baseInput(overrides: Partial<RegistrarMovimientoInput> = {}): RegistrarMovimientoInput {
  return {
    productId: 'p-1',
    warehouseId: 'w-1',
    movementTypeId: 'mt-in',
    quantity: 10,
    ...overrides,
  } as RegistrarMovimientoInput;
}

describe('MovimientosService', () => {
  let productoValido: boolean;
  let almacen: warehouses | null;
  let ubicacion: warehouse_locations | null;
  let tipoRegistrado: stock_movement_types | null;
  let registrarError: Error | null;
  let movimientoRepository: MovimientoStockRepository;
  let tipoMovimientoRepository: TipoMovimientoStockRepository;
  let productoLookupRepository: ProductoLookupRepository;
  let almacenRepository: AlmacenRepository;
  let ubicacionRepository: UbicacionAlmacenRepository;

  beforeEach(() => {
    productoValido = true;
    almacen = ALMACEN;
    ubicacion = UBICACION;
    tipoRegistrado = TIPO_ENTRADA;
    registrarError = null;

    movimientoRepository = {
      registrar: jest.fn(async () => {
        if (registrarError) throw registrarError;
        return {
          movimiento: { id: 'mv-1' } as stock_movements,
          stockActualizado: {} as never,
        };
      }),
      listar: jest.fn(async () => ({ data: [], meta: { page: 1, pageSize: 20, total: 0 } })),
    } as unknown as MovimientoStockRepository;

    tipoMovimientoRepository = {
      findById: jest.fn(async () => tipoRegistrado),
    } as unknown as TipoMovimientoStockRepository;

    productoLookupRepository = {
      existeProducto: jest.fn(async () => productoValido),
    } as unknown as ProductoLookupRepository;

    almacenRepository = {
      findById: jest.fn(async () => almacen),
    } as unknown as AlmacenRepository;

    ubicacionRepository = {
      findById: jest.fn(async () => ubicacion),
    } as unknown as UbicacionAlmacenRepository;
  });

  function buildService(): MovimientosService {
    return new MovimientosService(
      movimientoRepository,
      tipoMovimientoRepository,
      productoLookupRepository,
      almacenRepository,
      ubicacionRepository,
    );
  }

  it('registrar: rechaza un tipo de movimiento inexistente', async () => {
    tipoRegistrado = null;
    await expect(buildService().registrar(CONTEXT, baseInput())).rejects.toThrow(
      TipoMovimientoInvalidoException,
    );
  });

  it('registrar: rechaza cantidad cero (defensa en profundidad de la entidad)', async () => {
    await expect(buildService().registrar(CONTEXT, baseInput({ quantity: 0 }))).rejects.toThrow(
      'cantidad de un movimiento debe ser mayor que cero',
    );
  });

  it('registrar: rechaza un producto inexistente', async () => {
    productoValido = false;
    await expect(buildService().registrar(CONTEXT, baseInput())).rejects.toThrow(
      ProductoInvalidoException,
    );
  });

  it('registrar: rechaza un almacén inexistente', async () => {
    almacen = null;
    await expect(buildService().registrar(CONTEXT, baseInput())).rejects.toThrow(
      AlmacenInvalidoException,
    );
  });

  it('registrar: rechaza una ubicación inexistente cuando se indica', async () => {
    ubicacion = null;
    await expect(
      buildService().registrar(CONTEXT, baseInput({ locationId: 'loc-x' })),
    ).rejects.toThrow(UbicacionInvalidaException);
  });

  it('registrar: caso feliz de entrada delega al repositorio con la dirección resuelta', async () => {
    const movimiento = await buildService().registrar(CONTEXT, baseInput());
    expect(movimiento.id).toBe('mv-1');
    expect(movimientoRepository.registrar).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({
        direction: 'in',
        companyId: 'company-1',
        branchId: 'branch-1',
        quantity: 10,
      }),
    );
  });

  it('registrar: caso feliz de salida resuelve direction "out" del tipo', async () => {
    tipoRegistrado = TIPO_SALIDA;
    await buildService().registrar(CONTEXT, baseInput({ movementTypeId: 'mt-out' }));
    expect(movimientoRepository.registrar).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ direction: 'out' }),
    );
  });

  it('registrar: traduce StockInsuficienteError del repositorio a excepción de dominio', async () => {
    registrarError = new StockInsuficienteError(3, 10);
    await expect(buildService().registrar(CONTEXT, baseInput())).rejects.toThrow(
      StockInsuficienteException,
    );
  });

  it('listar: delega al repositorio', async () => {
    const resultado = await buildService().listar(CONTEXT, {}, { page: 1, pageSize: 20 });
    expect(resultado.meta.total).toBe(0);
    expect(movimientoRepository.listar).toHaveBeenCalled();
  });
});
