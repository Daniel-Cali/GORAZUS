import type { UserContext } from '@gorazus/contracts';
import type { warehouses } from '@gorazus/core-database';
import { PickingRuleRepository } from '../repositories/picking-rule.repository';
import { AlmacenRepository } from '../repositories/almacen.repository';
import { PickingRulesService } from './picking-rules.service';
import { AlmacenInvalidoException } from './movimientos.service';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

const ALMACEN = { id: 'w-1', company_id: 'company-1', branch_id: 'branch-1' } as warehouses;

describe('PickingRulesService', () => {
  let almacen: warehouses | null;
  let reglas: Array<{ id: string; warehouse_id: string; strategy: string }>;
  let pickingRuleRepository: PickingRuleRepository;
  let almacenRepository: AlmacenRepository;

  beforeEach(() => {
    almacen = ALMACEN;
    reglas = [];

    pickingRuleRepository = {
      create: jest.fn(async (_ctx, data) => ({ id: 'pk-1', ...data })),
      findById: jest.fn(async () => null),
      findMany: jest.fn(async (_ctx: unknown, filter: Record<string, unknown>) => {
        const data = reglas.filter((r) =>
          Object.entries(filter).every(([k, v]) => (r as Record<string, unknown>)[k] === v),
        );
        return { data, meta: { page: 1, pageSize: 1, total: data.length } };
      }),
      update: jest.fn(async (_ctx, _where, data) => ({ id: 'pk-1', ...data })),
    } as unknown as PickingRuleRepository;

    almacenRepository = { findById: jest.fn(async () => almacen) } as unknown as AlmacenRepository;
  });

  function buildService(): PickingRulesService {
    return new PickingRulesService(pickingRuleRepository, almacenRepository);
  }

  it('crear: rechaza una estrategia inválida (invariante de la entidad)', async () => {
    await expect(
      buildService().crear(CONTEXT, { warehouseId: 'w-1', strategy: 'random' as never }),
    ).rejects.toThrow('Estrategia de picking inválida');
  });

  it('crear: rechaza almacén inexistente', async () => {
    almacen = null;
    await expect(
      buildService().crear(CONTEXT, { warehouseId: 'w-1', strategy: 'fifo' }),
    ).rejects.toThrow(AlmacenInvalidoException);
  });

  it('resolverEstrategia: devuelve la estrategia configurada del almacén', async () => {
    reglas = [{ id: 'pk-1', warehouse_id: 'w-1', strategy: 'fefo' }];
    const resultado = await buildService().resolverEstrategia(CONTEXT, 'w-1');
    expect(resultado).toBe('fefo');
  });

  it('resolverEstrategia: null si el almacén no tiene ninguna regla', async () => {
    const resultado = await buildService().resolverEstrategia(CONTEXT, 'w-1');
    expect(resultado).toBeNull();
  });
});
