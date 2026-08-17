import type { UserContext } from '@gorazus/contracts';
import { InventoryLotRepository } from '../repositories/inventory-lot.repository';
import { LotesInventarioService, LoteNoEncontradoException } from './lotes-inventario.service';

const CONTEXT_TENANT_A: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-A',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

const LOTE_VENCIDO = { id: 'lot-1', product_id: 'p-1', expiry_date: new Date('2020-01-01') };

describe('LotesInventarioService', () => {
  let inventoryLotRepository: InventoryLotRepository;

  beforeEach(() => {
    inventoryLotRepository = {
      obtenerPorId: jest.fn(async () => null),
      listar: jest.fn(async () => ({ data: [], meta: { page: 1, pageSize: 20, total: 0 } })),
      listarProximosAVencer: jest.fn(async () => ({
        data: [],
        meta: { page: 1, pageSize: 20, total: 0 },
      })),
      listarVencidos: jest.fn(async () => ({
        data: [LOTE_VENCIDO],
        meta: { page: 1, pageSize: 20, total: 1 },
      })),
    } as unknown as InventoryLotRepository;
  });

  function buildService(): LotesInventarioService {
    return new LotesInventarioService(inventoryLotRepository);
  }

  it('obtenerPorId: lanza LoteNoEncontradoException si el repositorio devuelve null', async () => {
    await expect(buildService().obtenerPorId(CONTEXT_TENANT_A, 'lot-x')).rejects.toThrow(
      LoteNoEncontradoException,
    );
  });

  // Test de misión #4 (Lotes): "Expired lot query" → devuelve los lotes vencidos correctamente.
  it('listarVencidos: devuelve los lotes con expiry_date en el pasado', async () => {
    const resultado = await buildService().listarVencidos(CONTEXT_TENANT_A, {
      page: 1,
      pageSize: 20,
    });
    expect(resultado.data).toEqual([LOTE_VENCIDO]);
    expect(inventoryLotRepository.listarVencidos).toHaveBeenCalledWith(CONTEXT_TENANT_A, {
      page: 1,
      pageSize: 20,
    });
  });

  // Test de misión #8: aislamiento de tenant — el servicio propaga el
  // UserContext real al repositorio; la exclusión cruzada de tenant la aplica
  // Postgres RLS + `withTenantScope` (no verificable con un mock, requiere
  // Postgres real — mismo criterio que el resto de la sesión, Docker inactivo).
  it('listarPorProducto: propaga el tenantId del contexto real al repositorio', async () => {
    const contextTenantB: UserContext = { ...CONTEXT_TENANT_A, tenantId: 'tenant-B' };
    await buildService().listarPorProducto(contextTenantB, 'p-1', undefined, {
      page: 1,
      pageSize: 20,
    });
    expect(inventoryLotRepository.listar).toHaveBeenCalledWith(
      contextTenantB,
      expect.objectContaining({ product_id: 'p-1' }),
      { page: 1, pageSize: 20 },
    );
  });
});
