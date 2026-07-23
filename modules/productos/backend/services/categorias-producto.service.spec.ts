import type { UserContext } from '@gorazus/contracts';
import type { product_categories, PaginatedResult } from '@gorazus/core-database';
import { CategoriaProductoRepository } from '../repositories/categoria-producto.repository';
import { EmpresaLookupRepository } from '../repositories/empresa-lookup.repository';
import {
  CategoriasProductoService,
  CategoriaProductoNoEncontradaException,
  EmpresaInvalidaException,
  CategoriaPadreInvalidaException,
} from './categorias-producto.service';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

function buildCategoria(overrides: Partial<product_categories> = {}): product_categories {
  return {
    id: 'c1',
    tenant_id: 'tenant-1',
    company_id: 'company-1',
    branch_id: 'branch-1',
    code: 'HERR',
    parent_category_id: null,
    ...overrides,
  } as product_categories;
}

describe('CategoriasProductoService', () => {
  let categorias: Map<string, product_categories>;
  let empresaValida: boolean;
  let categoriaProductoRepository: CategoriaProductoRepository;
  let empresaLookupRepository: EmpresaLookupRepository;

  beforeEach(() => {
    categorias = new Map([['c1', buildCategoria()]]);
    empresaValida = true;

    categoriaProductoRepository = {
      findById: jest.fn(
        async (_ctx: unknown, where: { id: string }) => categorias.get(where.id) ?? null,
      ),
      findMany: jest.fn(async (_ctx: unknown, filter: Partial<product_categories>) => {
        const data = [...categorias.values()].filter(
          (c) =>
            filter.parent_category_id === undefined ||
            c.parent_category_id === filter.parent_category_id,
        );
        return {
          data,
          meta: { page: 1, pageSize: 20, total: data.length },
        } as PaginatedResult<product_categories>;
      }),
      create: jest.fn(async (_ctx: unknown, data: Partial<product_categories>) => {
        const nueva = buildCategoria({ id: 'c-nueva', ...data });
        categorias.set(nueva.id, nueva);
        return nueva;
      }),
      update: jest.fn(
        async (_ctx: unknown, where: { id: string }, data: Partial<product_categories>) => {
          const actual = categorias.get(where.id);
          if (!actual) throw new Error('no existe');
          const actualizada = { ...actual, ...data };
          categorias.set(where.id, actualizada);
          return actualizada;
        },
      ),
    } as unknown as CategoriaProductoRepository;

    empresaLookupRepository = {
      existeEmpresa: jest.fn(async () => empresaValida),
    } as unknown as EmpresaLookupRepository;
  });

  function buildService(): CategoriasProductoService {
    return new CategoriasProductoService(categoriaProductoRepository, empresaLookupRepository);
  }

  it('crear: rechaza si la empresa no existe', async () => {
    empresaValida = false;
    await expect(
      buildService().crear(CONTEXT, { companyId: 'company-x', code: 'FERR' }),
    ).rejects.toThrow(EmpresaInvalidaException);
  });

  it('crear: rechaza un padre inexistente', async () => {
    await expect(
      buildService().crear(CONTEXT, {
        companyId: 'company-1',
        code: 'FERR',
        parentCategoryId: 'no-existe',
      }),
    ).rejects.toThrow(CategoriaPadreInvalidaException);
  });

  it('crear: acepta un padre válido', async () => {
    const categoria = await buildService().crear(CONTEXT, {
      companyId: 'company-1',
      code: 'MANUAL',
      parentCategoryId: 'c1',
    });
    expect(categoria.parent_category_id).toBe('c1');
  });

  it('obtener: categoría inexistente lanza CategoriaProductoNoEncontradaException', async () => {
    await expect(buildService().obtener(CONTEXT, 'no-existe')).rejects.toThrow(
      CategoriaProductoNoEncontradaException,
    );
  });

  it('actualizar: PATCH parcial', async () => {
    const categoria = await buildService().actualizar(CONTEXT, 'c1', { code: 'HERR-2' });
    expect(categoria.code).toBe('HERR-2');
  });
});
