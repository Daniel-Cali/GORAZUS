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
      registrarLote: jest.fn(async (_ctx: unknown, items: unknown[]) => {
        if (registrarError) throw registrarError;
        return items.map((_, i) => ({
          movimiento: { id: `mv-lote-${i}` } as stock_movements,
          stockActualizado: {} as never,
        }));
      }),
      listar: jest.fn(async () => ({ data: [], meta: { page: 1, pageSize: 20, total: 0 } })),
      obtenerPorIdempotencyKey: jest.fn(async () => null),
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

  it('registrarLote: valida cada item y delega al repositorio en un solo llamado', async () => {
    const movimientos = await buildService().registrarLote(CONTEXT, [
      baseInput({ productId: 'p-1' }),
      baseInput({ productId: 'p-2' }),
    ]);
    expect(movimientos).toHaveLength(2);
    expect(movimientoRepository.registrarLote).toHaveBeenCalledTimes(1);
    expect(movimientoRepository.registrarLote).toHaveBeenCalledWith(
      CONTEXT,
      expect.arrayContaining([
        expect.objectContaining({ productId: 'p-1' }),
        expect.objectContaining({ productId: 'p-2' }),
      ]),
    );
  });

  it('registrarLote: rechaza si cualquier item referencia un producto inexistente', async () => {
    productoValido = false;
    await expect(buildService().registrarLote(CONTEXT, [baseInput()])).rejects.toThrow(
      ProductoInvalidoException,
    );
    expect(movimientoRepository.registrarLote).not.toHaveBeenCalled();
  });

  it('registrarLote: traduce StockInsuficienteError del repositorio', async () => {
    registrarError = new StockInsuficienteError(3, 10);
    await expect(buildService().registrarLote(CONTEXT, [baseInput()])).rejects.toThrow(
      StockInsuficienteException,
    );
  });

  it('listar: delega al repositorio', async () => {
    const resultado = await buildService().listar(CONTEXT, {}, { page: 1, pageSize: 20 });
    expect(resultado.meta.total).toBe(0);
    expect(movimientoRepository.listar).toHaveBeenCalled();
  });

  describe('ISSUE-07: idempotencyKey', () => {
    it('registrar: sin idempotencyKey, nunca consulta obtenerPorIdempotencyKey', async () => {
      await buildService().registrar(CONTEXT, baseInput());
      expect(movimientoRepository.obtenerPorIdempotencyKey).not.toHaveBeenCalled();
      expect(movimientoRepository.registrar).toHaveBeenCalledWith(
        CONTEXT,
        expect.objectContaining({ idempotencyKey: null }),
      );
    });

    it('registrar: clave nueva (sin registro previo) — sigue el flujo normal y la propaga al repositorio', async () => {
      await buildService().registrar(CONTEXT, baseInput({ idempotencyKey: 'abc' }));
      expect(movimientoRepository.obtenerPorIdempotencyKey).toHaveBeenCalledWith(CONTEXT, 'abc');
      expect(tipoMovimientoRepository.findById).toHaveBeenCalled(); // sí corrió resolverYValidar
      expect(movimientoRepository.registrar).toHaveBeenCalledWith(
        CONTEXT,
        expect.objectContaining({ idempotencyKey: 'abc' }),
      );
    });

    it('registrar: clave con movimiento previo — devuelve el original, NUNCA valida ni crea de nuevo', async () => {
      const movimientoExistente = { id: 'mv-existente' } as stock_movements;
      (movimientoRepository.obtenerPorIdempotencyKey as jest.Mock).mockResolvedValueOnce(
        movimientoExistente,
      );

      const resultado = await buildService().registrar(
        CONTEXT,
        baseInput({ idempotencyKey: 'abc' }),
      );

      expect(resultado).toBe(movimientoExistente);
      expect(tipoMovimientoRepository.findById).not.toHaveBeenCalled(); // resolverYValidar NUNCA corrió
      expect(movimientoRepository.registrar).not.toHaveBeenCalled();
    });

    it('registrar: dos claves distintas producen dos llamadas independientes al repositorio', async () => {
      await buildService().registrar(CONTEXT, baseInput({ idempotencyKey: 'key-1' }));
      await buildService().registrar(CONTEXT, baseInput({ idempotencyKey: 'key-2' }));

      expect(movimientoRepository.registrar).toHaveBeenCalledTimes(2);
      expect(movimientoRepository.registrar).toHaveBeenNthCalledWith(
        1,
        CONTEXT,
        expect.objectContaining({ idempotencyKey: 'key-1' }),
      );
      expect(movimientoRepository.registrar).toHaveBeenNthCalledWith(
        2,
        CONTEXT,
        expect.objectContaining({ idempotencyKey: 'key-2' }),
      );
    });
  });
});
