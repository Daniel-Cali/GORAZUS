import type { UserContext } from '@gorazus/contracts';
import type { stock, PaginatedResult } from '@gorazus/core-database';
import { StockRepository } from '../repositories/stock.repository';
import { StockService } from './stock.service';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

function buildStock(overrides: Partial<stock> = {}): stock {
  return {
    id: 's-1',
    tenant_id: 'tenant-1',
    company_id: 'company-1',
    branch_id: 'branch-1',
    product_id: 'p-1',
    warehouse_id: 'w-1',
    location_id: null,
    quantity_on_hand: 10 as unknown as stock['quantity_on_hand'],
    quantity_reserved: 4 as unknown as stock['quantity_reserved'],
    ...overrides,
  } as stock;
}

describe('StockService', () => {
  let filas: Map<string, stock>;
  let repository: StockRepository;

  beforeEach(() => {
    filas = new Map([['s-1', buildStock()]]);
    repository = {
      obtener: jest.fn(
        async (_ctx: unknown, filtro: { productId: string; warehouseId: string }) => {
          return (
            [...filas.values()].find(
              (f) => f.product_id === filtro.productId && f.warehouse_id === filtro.warehouseId,
            ) ?? null
          );
        },
      ),
      listar: jest.fn(async () => {
        const data = [...filas.values()];
        return {
          data,
          meta: { page: 1, pageSize: 20, total: data.length },
        } as PaginatedResult<stock>;
      }),
    } as unknown as StockRepository;
  });

  function buildService(): StockService {
    return new StockService(repository);
  }

  it('obtenerDisponible: calcula a mano - reservado', async () => {
    const disponible = await buildService().obtenerDisponible(CONTEXT, {
      productId: 'p-1',
      warehouseId: 'w-1',
    });
    expect(disponible.quantityOnHand).toBe(10);
    expect(disponible.quantityReserved).toBe(4);
    expect(disponible.quantityAvailable).toBe(6);
  });

  it('obtenerDisponible: sin fila de stock devuelve todo en cero', async () => {
    const disponible = await buildService().obtenerDisponible(CONTEXT, {
      productId: 'p-inexistente',
      warehouseId: 'w-1',
    });
    expect(disponible.quantityOnHand).toBe(0);
    expect(disponible.quantityAvailable).toBe(0);
  });

  it('listar: mapea cada fila con su disponible calculado', async () => {
    filas.set(
      's-2',
      buildStock({
        id: 's-2',
        product_id: 'p-2',
        quantity_on_hand: 5 as never,
        quantity_reserved: 0 as never,
      }),
    );
    const resultado = await buildService().listar(CONTEXT, {}, { page: 1, pageSize: 20 });
    expect(resultado.data).toHaveLength(2);
    expect(resultado.data.find((d) => d.productId === 'p-2')?.quantityAvailable).toBe(5);
  });
});
