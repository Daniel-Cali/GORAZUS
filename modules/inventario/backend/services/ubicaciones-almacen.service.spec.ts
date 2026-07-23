import type { UserContext } from '@gorazus/contracts';
import type { warehouse_zones, warehouse_locations, PaginatedResult } from '@gorazus/core-database';
import { UbicacionAlmacenRepository } from '../repositories/ubicacion-almacen.repository';
import { ZonaAlmacenRepository } from '../repositories/zona-almacen.repository';
import {
  UbicacionesAlmacenService,
  UbicacionAlmacenNoEncontradaException,
  ZonaInvalidaException,
  UbicacionPadreInvalidaException,
} from './ubicaciones-almacen.service';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

function buildUbicacion(overrides: Partial<warehouse_locations> = {}): warehouse_locations {
  return {
    id: 'loc-1',
    tenant_id: 'tenant-1',
    company_id: 'company-1',
    branch_id: 'branch-1',
    zone_id: 'zone-1',
    code: 'PASILLO-A',
    parent_location_id: null,
    ...overrides,
  } as warehouse_locations;
}

describe('UbicacionesAlmacenService', () => {
  let ubicaciones: Map<string, warehouse_locations>;
  let zonaExiste: boolean;
  let ubicacionAlmacenRepository: UbicacionAlmacenRepository;
  let zonaAlmacenRepository: ZonaAlmacenRepository;

  beforeEach(() => {
    ubicaciones = new Map([['loc-1', buildUbicacion()]]);
    zonaExiste = true;

    ubicacionAlmacenRepository = {
      findById: jest.fn(
        async (_ctx: unknown, where: { id: string }) => ubicaciones.get(where.id) ?? null,
      ),
      findMany: jest.fn(async (_ctx: unknown, filter: Partial<warehouse_locations>) => {
        const data = [...ubicaciones.values()].filter(
          (u) => filter.zone_id === undefined || u.zone_id === filter.zone_id,
        );
        return {
          data,
          meta: { page: 1, pageSize: 20, total: data.length },
        } as PaginatedResult<warehouse_locations>;
      }),
      create: jest.fn(async (_ctx: unknown, data: Partial<warehouse_locations>) => {
        const nueva = buildUbicacion({ id: 'loc-nueva', ...data });
        ubicaciones.set(nueva.id, nueva);
        return nueva;
      }),
      update: jest.fn(
        async (_ctx: unknown, where: { id: string }, data: Partial<warehouse_locations>) => {
          const actual = ubicaciones.get(where.id);
          if (!actual) throw new Error('no existe');
          const actualizada = { ...actual, ...data };
          ubicaciones.set(where.id, actualizada);
          return actualizada;
        },
      ),
    } as unknown as UbicacionAlmacenRepository;

    zonaAlmacenRepository = {
      findById: jest.fn(async () =>
        zonaExiste
          ? ({ id: 'zone-1', company_id: 'company-1', branch_id: 'branch-1' } as warehouse_zones)
          : null,
      ),
    } as unknown as ZonaAlmacenRepository;
  });

  function buildService(): UbicacionesAlmacenService {
    return new UbicacionesAlmacenService(ubicacionAlmacenRepository, zonaAlmacenRepository);
  }

  it('crear: rechaza si la zona no existe', async () => {
    zonaExiste = false;
    await expect(
      buildService().crear(CONTEXT, { zoneId: 'zone-x', code: 'BIN-01' }),
    ).rejects.toThrow(ZonaInvalidaException);
  });

  it('crear: rechaza un padre que no pertenece a la misma zona', async () => {
    ubicaciones.set('loc-otra-zona', buildUbicacion({ id: 'loc-otra-zona', zone_id: 'zone-2' }));
    await expect(
      buildService().crear(CONTEXT, {
        zoneId: 'zone-1',
        code: 'BIN-01',
        parentLocationId: 'loc-otra-zona',
      }),
    ).rejects.toThrow(UbicacionPadreInvalidaException);
  });

  it('crear: rechaza un padre inexistente', async () => {
    await expect(
      buildService().crear(CONTEXT, {
        zoneId: 'zone-1',
        code: 'BIN-01',
        parentLocationId: 'no-existe',
      }),
    ).rejects.toThrow(UbicacionPadreInvalidaException);
  });

  it('crear: acepta un padre válido de la misma zona', async () => {
    const ubicacion = await buildService().crear(CONTEXT, {
      zoneId: 'zone-1',
      code: 'BIN-01',
      parentLocationId: 'loc-1',
    });
    expect(ubicacion.parent_location_id).toBe('loc-1');
    expect(ubicacion.company_id).toBe('company-1');
  });

  it('obtener: ubicación inexistente lanza UbicacionAlmacenNoEncontradaException', async () => {
    await expect(buildService().obtener(CONTEXT, 'no-existe')).rejects.toThrow(
      UbicacionAlmacenNoEncontradaException,
    );
  });

  it('actualizar: solo el código', async () => {
    const ubicacion = await buildService().actualizar(CONTEXT, 'loc-1', { code: 'PASILLO-B' });
    expect(ubicacion.code).toBe('PASILLO-B');
  });
});
