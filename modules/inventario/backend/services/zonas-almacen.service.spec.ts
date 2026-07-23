import type { UserContext } from '@gorazus/contracts';
import type { warehouses, warehouse_zones, PaginatedResult } from '@gorazus/core-database';
import { ZonaAlmacenRepository } from '../repositories/zona-almacen.repository';
import { AlmacenRepository } from '../repositories/almacen.repository';
import {
  ZonasAlmacenService,
  ZonaAlmacenNoEncontradaException,
  AlmacenInvalidoException,
} from './zonas-almacen.service';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

function buildZona(overrides: Partial<warehouse_zones> = {}): warehouse_zones {
  return {
    id: 'zone-1',
    tenant_id: 'tenant-1',
    company_id: 'company-1',
    branch_id: 'branch-1',
    warehouse_id: 'wh-1',
    name: 'Recepción',
    zone_function: 'receiving',
    ...overrides,
  } as warehouse_zones;
}

describe('ZonasAlmacenService', () => {
  let zonas: Map<string, warehouse_zones>;
  let almacenExiste: boolean;
  let zonaAlmacenRepository: ZonaAlmacenRepository;
  let almacenRepository: AlmacenRepository;

  beforeEach(() => {
    zonas = new Map([['zone-1', buildZona()]]);
    almacenExiste = true;

    zonaAlmacenRepository = {
      findById: jest.fn(
        async (_ctx: unknown, where: { id: string }) => zonas.get(where.id) ?? null,
      ),
      findMany: jest.fn(async (_ctx: unknown, filter: Partial<warehouse_zones>) => {
        const data = [...zonas.values()].filter(
          (z) => filter.warehouse_id === undefined || z.warehouse_id === filter.warehouse_id,
        );
        return {
          data,
          meta: { page: 1, pageSize: 20, total: data.length },
        } as PaginatedResult<warehouse_zones>;
      }),
      create: jest.fn(async (_ctx: unknown, data: Partial<warehouse_zones>) => {
        const nueva = buildZona({ id: 'zone-nueva', ...data });
        zonas.set(nueva.id, nueva);
        return nueva;
      }),
      update: jest.fn(
        async (_ctx: unknown, where: { id: string }, data: Partial<warehouse_zones>) => {
          const actual = zonas.get(where.id);
          if (!actual) throw new Error('no existe');
          const actualizada = { ...actual, ...data };
          zonas.set(where.id, actualizada);
          return actualizada;
        },
      ),
    } as unknown as ZonaAlmacenRepository;

    almacenRepository = {
      findById: jest.fn(async () =>
        almacenExiste
          ? ({ id: 'wh-1', company_id: 'company-1', branch_id: 'branch-1' } as warehouses)
          : null,
      ),
    } as unknown as AlmacenRepository;
  });

  function buildService(): ZonasAlmacenService {
    return new ZonasAlmacenService(zonaAlmacenRepository, almacenRepository);
  }

  it('crear: rechaza si el almacén no existe', async () => {
    almacenExiste = false;
    await expect(
      buildService().crear(CONTEXT, { warehouseId: 'wh-x', name: 'Zona', zoneFunction: 'storage' }),
    ).rejects.toThrow(AlmacenInvalidoException);
  });

  it('crear: hereda company_id/branch_id del almacén padre', async () => {
    const zona = await buildService().crear(CONTEXT, {
      warehouseId: 'wh-1',
      name: 'Picking',
      zoneFunction: 'picking',
    });
    expect(zona.company_id).toBe('company-1');
    expect(zona.branch_id).toBe('branch-1');
  });

  it('obtener: zona inexistente lanza ZonaAlmacenNoEncontradaException', async () => {
    await expect(buildService().obtener(CONTEXT, 'no-existe')).rejects.toThrow(
      ZonaAlmacenNoEncontradaException,
    );
  });

  it('listar: filtra por warehouseId cuando se indica', async () => {
    zonas.set('zone-2', buildZona({ id: 'zone-2', warehouse_id: 'wh-2' }));
    const resultado = await buildService().listar(CONTEXT, 'wh-1', { page: 1, pageSize: 20 });
    expect(resultado.data.map((z) => z.id)).toEqual(['zone-1']);
  });

  it('actualizar: PATCH parcial', async () => {
    const zona = await buildService().actualizar(CONTEXT, 'zone-1', {
      name: 'Recepción renombrada',
    });
    expect(zona.name).toBe('Recepción renombrada');
    expect(zona.zone_function).toBe('receiving');
  });
});
