import type { UserContext } from '@gorazus/contracts';
import type { warehouses, warehouse_zones } from '@gorazus/core-database';
import { PutawayRuleRepository } from '../repositories/putaway-rule.repository';
import { AlmacenRepository } from '../repositories/almacen.repository';
import { ZonaAlmacenRepository } from '../repositories/zona-almacen.repository';
import { PutawayRulesService, ZonaDestinoInvalidaException } from './putaway-rules.service';
import { AlmacenInvalidoException } from './movimientos.service';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

const ALMACEN = { id: 'w-1', company_id: 'company-1', branch_id: 'branch-1' } as warehouses;
const ZONA = { id: 'z-1', warehouse_id: 'w-1' } as warehouse_zones;

describe('PutawayRulesService', () => {
  let almacen: warehouses | null;
  let zona: warehouse_zones | null;
  let reglas: Array<{
    id: string;
    warehouse_id: string;
    target_zone_id: string;
    priority: number;
    product_category_id: string | null;
  }>;
  let putawayRuleRepository: PutawayRuleRepository;
  let almacenRepository: AlmacenRepository;
  let zonaAlmacenRepository: ZonaAlmacenRepository;

  beforeEach(() => {
    almacen = ALMACEN;
    zona = ZONA;
    reglas = [];

    putawayRuleRepository = {
      create: jest.fn(async (_ctx, data) => ({ id: 'pr-1', ...data })),
      findById: jest.fn(async () => null),
      findMany: jest.fn(async (_ctx: unknown, filter: Record<string, unknown>) => {
        const data = reglas.filter((r) =>
          Object.entries(filter).every(([k, v]) => (r as Record<string, unknown>)[k] === v),
        );
        return { data, meta: { page: 1, pageSize: 100, total: data.length } };
      }),
      update: jest.fn(async (_ctx, _where, data) => ({ id: 'pr-1', ...data })),
    } as unknown as PutawayRuleRepository;

    almacenRepository = { findById: jest.fn(async () => almacen) } as unknown as AlmacenRepository;
    zonaAlmacenRepository = {
      findById: jest.fn(async () => zona),
    } as unknown as ZonaAlmacenRepository;
  });

  function buildService(): PutawayRulesService {
    return new PutawayRulesService(putawayRuleRepository, almacenRepository, zonaAlmacenRepository);
  }

  it('crear: rechaza almacén inexistente', async () => {
    almacen = null;
    await expect(
      buildService().crear(CONTEXT, { warehouseId: 'w-1', targetZoneId: 'z-1', priority: 0 }),
    ).rejects.toThrow(AlmacenInvalidoException);
  });

  it('crear: rechaza zona destino que no pertenece al almacén', async () => {
    zona = { id: 'z-1', warehouse_id: 'w-otro' } as warehouse_zones;
    await expect(
      buildService().crear(CONTEXT, { warehouseId: 'w-1', targetZoneId: 'z-1', priority: 0 }),
    ).rejects.toThrow(ZonaDestinoInvalidaException);
  });

  it('resolverZonaDestino: regla específica de categoría gana sobre la genérica', async () => {
    reglas = [
      {
        id: 'pr-1',
        warehouse_id: 'w-1',
        target_zone_id: 'z-generica',
        priority: 5,
        product_category_id: null,
      },
      {
        id: 'pr-2',
        warehouse_id: 'w-1',
        target_zone_id: 'z-especifica',
        priority: 0,
        product_category_id: 'cat-1',
      },
    ];
    const resultado = await buildService().resolverZonaDestino(CONTEXT, {
      warehouseId: 'w-1',
      productCategoryId: 'cat-1',
    });
    expect(resultado).toBe('z-especifica');
  });

  it('resolverZonaDestino: sin categoría, usa la regla genérica de mayor prioridad', async () => {
    reglas = [
      {
        id: 'pr-1',
        warehouse_id: 'w-1',
        target_zone_id: 'z-baja',
        priority: 1,
        product_category_id: null,
      },
      {
        id: 'pr-2',
        warehouse_id: 'w-1',
        target_zone_id: 'z-alta',
        priority: 9,
        product_category_id: null,
      },
    ];
    const resultado = await buildService().resolverZonaDestino(CONTEXT, { warehouseId: 'w-1' });
    expect(resultado).toBe('z-alta');
  });

  it('resolverZonaDestino: null si no hay ninguna regla configurada', async () => {
    const resultado = await buildService().resolverZonaDestino(CONTEXT, { warehouseId: 'w-1' });
    expect(resultado).toBeNull();
  });
});
