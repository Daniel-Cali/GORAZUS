import type { UserContext } from '@gorazus/contracts';
import type { warehouses, PaginatedResult } from '@gorazus/core-database';
import { AlmacenRepository } from '../repositories/almacen.repository';
import { EmpresaSucursalLookupRepository } from '../repositories/empresa-sucursal-lookup.repository';
import {
  AlmacenesService,
  AlmacenNoEncontradoException,
  EmpresaInvalidaException,
  SucursalInvalidaException,
} from './almacenes.service';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

function buildAlmacen(overrides: Partial<warehouses> = {}): warehouses {
  return {
    id: 'wh-1',
    tenant_id: 'tenant-1',
    company_id: 'company-1',
    branch_id: 'branch-1',
    name: 'Almacén Central',
    code: 'ALM-01',
    warehouse_type: 'physical',
    ...overrides,
  } as warehouses;
}

describe('AlmacenesService', () => {
  let almacenes: Map<string, warehouses>;
  let empresaValida: boolean;
  let sucursalValida: boolean;
  let almacenRepository: AlmacenRepository;
  let empresaSucursalLookupRepository: EmpresaSucursalLookupRepository;

  beforeEach(() => {
    almacenes = new Map([['wh-1', buildAlmacen()]]);
    empresaValida = true;
    sucursalValida = true;

    almacenRepository = {
      findById: jest.fn(
        async (_ctx: unknown, where: { id: string }) => almacenes.get(where.id) ?? null,
      ),
      findMany: jest.fn(async (_ctx: unknown, filter: Partial<warehouses>) => {
        const data = [...almacenes.values()].filter(
          (a) => filter.branch_id === undefined || a.branch_id === filter.branch_id,
        );
        return {
          data,
          meta: { page: 1, pageSize: 20, total: data.length },
        } as PaginatedResult<warehouses>;
      }),
      create: jest.fn(async (_ctx: unknown, data: Partial<warehouses>) => {
        const nuevo = buildAlmacen({ id: 'wh-nuevo', ...data });
        almacenes.set(nuevo.id, nuevo);
        return nuevo;
      }),
      update: jest.fn(async (_ctx: unknown, where: { id: string }, data: Partial<warehouses>) => {
        const actual = almacenes.get(where.id);
        if (!actual) throw new Error('no existe');
        const actualizado = { ...actual, ...data };
        almacenes.set(where.id, actualizado);
        return actualizado;
      }),
    } as unknown as AlmacenRepository;

    empresaSucursalLookupRepository = {
      existeEmpresa: jest.fn(async () => empresaValida),
      existeSucursalDeEmpresa: jest.fn(async () => sucursalValida),
    } as unknown as EmpresaSucursalLookupRepository;
  });

  function buildService(): AlmacenesService {
    return new AlmacenesService(almacenRepository, empresaSucursalLookupRepository);
  }

  it('crear: rechaza si la empresa no existe', async () => {
    empresaValida = false;
    await expect(
      buildService().crear(CONTEXT, {
        companyId: 'company-x',
        branchId: 'branch-1',
        name: 'Nuevo',
        code: 'ALM-02',
        warehouseType: 'physical',
      }),
    ).rejects.toThrow(EmpresaInvalidaException);
  });

  it('crear: rechaza si la sucursal no existe o no pertenece a la empresa', async () => {
    sucursalValida = false;
    await expect(
      buildService().crear(CONTEXT, {
        companyId: 'company-1',
        branchId: 'branch-x',
        name: 'Nuevo',
        code: 'ALM-02',
        warehouseType: 'physical',
      }),
    ).rejects.toThrow(SucursalInvalidaException);
  });

  it('crear: caso feliz crea el almacén', async () => {
    const almacen = await buildService().crear(CONTEXT, {
      companyId: 'company-1',
      branchId: 'branch-1',
      name: 'Nuevo',
      code: 'ALM-02',
      warehouseType: 'virtual',
    });
    expect(almacen.name).toBe('Nuevo');
    expect(almacen.warehouse_type).toBe('virtual');
  });

  it('obtener: almacén inexistente lanza AlmacenNoEncontradoException', async () => {
    await expect(buildService().obtener(CONTEXT, 'no-existe')).rejects.toThrow(
      AlmacenNoEncontradoException,
    );
  });

  it('listar: filtra por branchId cuando se indica', async () => {
    almacenes.set('wh-2', buildAlmacen({ id: 'wh-2', branch_id: 'branch-2' }));
    const resultado = await buildService().listar(CONTEXT, 'branch-1', { page: 1, pageSize: 20 });
    expect(resultado.data.map((a) => a.id)).toEqual(['wh-1']);
  });

  it('actualizar: PATCH parcial solo toca los campos indicados', async () => {
    const almacen = await buildService().actualizar(CONTEXT, 'wh-1', { name: 'Renombrado' });
    expect(almacen.name).toBe('Renombrado');
    expect(almacen.code).toBe('ALM-01');
  });
});
