import type { UserContext } from '@gorazus/contracts';
import type { brands, product_models, PaginatedResult } from '@gorazus/core-database';
import { ModeloProductoRepository } from '../repositories/modelo-producto.repository';
import { MarcaRepository } from '../repositories/marca.repository';
import { EmpresaLookupRepository } from '../repositories/empresa-lookup.repository';
import {
  ModelosProductoService,
  ModeloProductoNoEncontradoException,
  EmpresaInvalidaException,
  MarcaInvalidaException,
} from './modelos-producto.service';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

function buildModelo(overrides: Partial<product_models> = {}): product_models {
  return {
    id: 'mo1',
    tenant_id: 'tenant-1',
    company_id: 'company-1',
    branch_id: 'branch-1',
    brand_id: 'ma1',
    name: 'FatMax',
    ...overrides,
  } as product_models;
}

describe('ModelosProductoService', () => {
  let modelos: Map<string, product_models>;
  let empresaValida: boolean;
  let marcaExiste: boolean;
  let modeloProductoRepository: ModeloProductoRepository;
  let marcaRepository: MarcaRepository;
  let empresaLookupRepository: EmpresaLookupRepository;

  beforeEach(() => {
    modelos = new Map([['mo1', buildModelo()]]);
    empresaValida = true;
    marcaExiste = true;

    modeloProductoRepository = {
      findById: jest.fn(
        async (_ctx: unknown, where: { id: string }) => modelos.get(where.id) ?? null,
      ),
      findMany: jest.fn(async (_ctx: unknown, filter: Partial<product_models>) => {
        const data = [...modelos.values()].filter(
          (m) => filter.brand_id === undefined || m.brand_id === filter.brand_id,
        );
        return {
          data,
          meta: { page: 1, pageSize: 20, total: data.length },
        } as PaginatedResult<product_models>;
      }),
      create: jest.fn(async (_ctx: unknown, data: Partial<product_models>) => {
        const nuevo = buildModelo({ id: 'mo-nuevo', ...data });
        modelos.set(nuevo.id, nuevo);
        return nuevo;
      }),
      update: jest.fn(
        async (_ctx: unknown, where: { id: string }, data: Partial<product_models>) => {
          const actual = modelos.get(where.id);
          if (!actual) throw new Error('no existe');
          const actualizado = { ...actual, ...data };
          modelos.set(where.id, actualizado);
          return actualizado;
        },
      ),
    } as unknown as ModeloProductoRepository;

    marcaRepository = {
      findById: jest.fn(async () => (marcaExiste ? ({ id: 'ma1' } as brands) : null)),
    } as unknown as MarcaRepository;

    empresaLookupRepository = {
      existeEmpresa: jest.fn(async () => empresaValida),
    } as unknown as EmpresaLookupRepository;
  });

  function buildService(): ModelosProductoService {
    return new ModelosProductoService(
      modeloProductoRepository,
      marcaRepository,
      empresaLookupRepository,
    );
  }

  it('crear: rechaza si la empresa no existe', async () => {
    empresaValida = false;
    await expect(
      buildService().crear(CONTEXT, { companyId: 'company-x', brandId: 'ma1', name: 'X' }),
    ).rejects.toThrow(EmpresaInvalidaException);
  });

  it('crear: rechaza si la marca no existe', async () => {
    marcaExiste = false;
    await expect(
      buildService().crear(CONTEXT, { companyId: 'company-1', brandId: 'ma-x', name: 'X' }),
    ).rejects.toThrow(MarcaInvalidaException);
  });

  it('crear: caso feliz', async () => {
    const modelo = await buildService().crear(CONTEXT, {
      companyId: 'company-1',
      brandId: 'ma1',
      name: 'X-Series',
    });
    expect(modelo.name).toBe('X-Series');
  });

  it('obtener: modelo inexistente lanza ModeloProductoNoEncontradoException', async () => {
    await expect(buildService().obtener(CONTEXT, 'no-existe')).rejects.toThrow(
      ModeloProductoNoEncontradoException,
    );
  });

  it('listar: filtra por brandId', async () => {
    modelos.set('mo2', buildModelo({ id: 'mo2', brand_id: 'ma2' }));
    const resultado = await buildService().listar(CONTEXT, 'ma1', { page: 1, pageSize: 20 });
    expect(resultado.data.map((m) => m.id)).toEqual(['mo1']);
  });

  it('actualizar: PATCH parcial', async () => {
    const modelo = await buildService().actualizar(CONTEXT, 'mo1', { name: 'FatMax Xtreme' });
    expect(modelo.name).toBe('FatMax Xtreme');
  });
});
