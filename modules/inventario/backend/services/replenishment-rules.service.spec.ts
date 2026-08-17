import type { UserContext } from '@gorazus/contracts';
import type { warehouses } from '@gorazus/core-database';
import { ReplenishmentRuleRepository } from '../repositories/replenishment-rule.repository';
import { AlmacenRepository } from '../repositories/almacen.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import { StockService } from './stock.service';
import { ReplenishmentRulesService } from './replenishment-rules.service';
import { AlmacenInvalidoException, ProductoInvalidoException } from './movimientos.service';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

const ALMACEN = { id: 'w-1', company_id: 'company-1', branch_id: 'branch-1' } as warehouses;

describe('ReplenishmentRulesService', () => {
  let almacen: warehouses | null;
  let productoValido: boolean;
  let quantityOnHand: number;
  let reglas: Array<{
    id: string;
    warehouse_id: string;
    product_id: string;
    min_quantity: number;
    max_quantity: number;
  }>;
  let replenishmentRuleRepository: ReplenishmentRuleRepository;
  let almacenRepository: AlmacenRepository;
  let productoLookupRepository: ProductoLookupRepository;
  let stockService: StockService;

  beforeEach(() => {
    almacen = ALMACEN;
    productoValido = true;
    quantityOnHand = 5;
    reglas = [];

    replenishmentRuleRepository = {
      create: jest.fn(async (_ctx, data) => ({ id: 'rr-1', ...data })),
      findById: jest.fn(async () => null),
      findMany: jest.fn(async (_ctx: unknown, filter: Record<string, unknown>) => {
        const data = reglas.filter((r) =>
          Object.entries(filter).every(([k, v]) => (r as Record<string, unknown>)[k] === v),
        );
        return { data, meta: { page: 1, pageSize: 1, total: data.length } };
      }),
      update: jest.fn(async (_ctx, _where, data) => ({ id: 'rr-1', ...data })),
    } as unknown as ReplenishmentRuleRepository;

    almacenRepository = { findById: jest.fn(async () => almacen) } as unknown as AlmacenRepository;
    productoLookupRepository = {
      existeProducto: jest.fn(async () => productoValido),
    } as unknown as ProductoLookupRepository;
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
  });

  function buildService(): ReplenishmentRulesService {
    return new ReplenishmentRulesService(
      replenishmentRuleRepository,
      almacenRepository,
      productoLookupRepository,
      stockService,
    );
  }

  it('crear: rechaza maxQuantity <= minQuantity (invariante de la entidad)', async () => {
    await expect(
      buildService().crear(CONTEXT, {
        warehouseId: 'w-1',
        productId: 'p-1',
        minQuantity: 10,
        maxQuantity: 5,
      }),
    ).rejects.toThrow('cantidad máxima debe ser mayor');
  });

  it('crear: rechaza almacén inexistente', async () => {
    almacen = null;
    await expect(
      buildService().crear(CONTEXT, {
        warehouseId: 'w-1',
        productId: 'p-1',
        minQuantity: 5,
        maxQuantity: 20,
      }),
    ).rejects.toThrow(AlmacenInvalidoException);
  });

  it('crear: rechaza producto inexistente', async () => {
    productoValido = false;
    await expect(
      buildService().crear(CONTEXT, {
        warehouseId: 'w-1',
        productId: 'p-1',
        minQuantity: 5,
        maxQuantity: 20,
      }),
    ).rejects.toThrow(ProductoInvalidoException);
  });

  it('evaluar: null si no hay regla configurada para el producto/almacén', async () => {
    const resultado = await buildService().evaluar(CONTEXT, {
      productId: 'p-1',
      warehouseId: 'w-1',
    });
    expect(resultado).toBeNull();
  });

  it('evaluar: quantityOnHand por debajo de minQuantity sugiere reponer hasta maxQuantity', async () => {
    reglas = [
      { id: 'rr-1', warehouse_id: 'w-1', product_id: 'p-1', min_quantity: 10, max_quantity: 50 },
    ];
    quantityOnHand = 5;
    const resultado = await buildService().evaluar(CONTEXT, {
      productId: 'p-1',
      warehouseId: 'w-1',
    });
    expect(resultado).toEqual({
      necesitaReposicion: true,
      quantityOnHand: 5,
      minQuantity: 10,
      maxQuantity: 50,
      cantidadSugerida: 45,
    });
  });

  it('evaluar: quantityOnHand por encima de minQuantity no necesita reposición', async () => {
    reglas = [
      { id: 'rr-1', warehouse_id: 'w-1', product_id: 'p-1', min_quantity: 10, max_quantity: 50 },
    ];
    quantityOnHand = 20;
    const resultado = await buildService().evaluar(CONTEXT, {
      productId: 'p-1',
      warehouseId: 'w-1',
    });
    expect(resultado?.necesitaReposicion).toBe(false);
    expect(resultado?.cantidadSugerida).toBe(0);
  });
});
