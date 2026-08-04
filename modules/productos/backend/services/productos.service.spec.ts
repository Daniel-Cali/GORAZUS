import type { UserContext } from '@gorazus/contracts';
import type {
  brands,
  product_categories,
  product_models,
  products,
  units_of_measure,
  PaginatedResult,
} from '@gorazus/core-database';
import { ProductoRepository } from '../repositories/producto.repository';
import { UnidadMedidaRepository } from '../repositories/unidad-medida.repository';
import { CategoriaProductoRepository } from '../repositories/categoria-producto.repository';
import { MarcaRepository } from '../repositories/marca.repository';
import { ModeloProductoRepository } from '../repositories/modelo-producto.repository';
import { EmpresaLookupRepository } from '../repositories/empresa-lookup.repository';
import {
  ProductosService,
  ProductoNoEncontradoException,
  EmpresaInvalidaException,
  UnidadMedidaInvalidaException,
  CategoriaInvalidaException,
  MarcaInvalidaException,
  ModeloInvalidoException,
  ModeloNoPerteneceAMarcaException,
} from './productos.service';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

function buildProducto(overrides: Partial<products> = {}): products {
  return {
    id: 'p1',
    tenant_id: 'tenant-1',
    company_id: 'company-1',
    branch_id: 'branch-1',
    sku: 'SKU-1',
    product_type: 'good',
    category_id: null,
    brand_id: null,
    model_id: null,
    base_unit_id: 'u1',
    costing_method: 'average',
    tracks_serial: false,
    tracks_lot: false,
    standard_cost: null,
    list_price: null,
    ...overrides,
  } as products;
}

describe('ProductosService', () => {
  let productos: Map<string, products>;
  let empresaValida: boolean;
  let unidadExiste: boolean;
  let categoriaExiste: boolean;
  let marcaExiste: boolean;
  let modeloExistente: product_models | null;
  let productoRepository: ProductoRepository;
  let unidadMedidaRepository: UnidadMedidaRepository;
  let categoriaProductoRepository: CategoriaProductoRepository;
  let marcaRepository: MarcaRepository;
  let modeloProductoRepository: ModeloProductoRepository;
  let empresaLookupRepository: EmpresaLookupRepository;

  beforeEach(() => {
    productos = new Map([['p1', buildProducto()]]);
    empresaValida = true;
    unidadExiste = true;
    categoriaExiste = true;
    marcaExiste = true;
    modeloExistente = { id: 'mo1', brand_id: 'ma1' } as product_models;

    productoRepository = {
      findById: jest.fn(
        async (_ctx: unknown, where: { id: string }) => productos.get(where.id) ?? null,
      ),
      findMany: jest.fn(async (_ctx: unknown, filter: Partial<products>) => {
        const data = [...productos.values()].filter(
          (p) => filter.category_id === undefined || p.category_id === filter.category_id,
        );
        return {
          data,
          meta: { page: 1, pageSize: 20, total: data.length },
        } as PaginatedResult<products>;
      }),
      create: jest.fn(async (_ctx: unknown, data: Partial<products>) => {
        const nuevo = buildProducto({ id: 'p-nuevo', ...data });
        productos.set(nuevo.id, nuevo);
        return nuevo;
      }),
      update: jest.fn(async (_ctx: unknown, where: { id: string }, data: Partial<products>) => {
        const actual = productos.get(where.id);
        if (!actual) throw new Error('no existe');
        const actualizado = { ...actual, ...data };
        productos.set(where.id, actualizado);
        return actualizado;
      }),
    } as unknown as ProductoRepository;

    unidadMedidaRepository = {
      findById: jest.fn(async () => (unidadExiste ? ({ id: 'u1' } as units_of_measure) : null)),
    } as unknown as UnidadMedidaRepository;

    categoriaProductoRepository = {
      findById: jest.fn(async () =>
        categoriaExiste ? ({ id: 'cat1' } as product_categories) : null,
      ),
    } as unknown as CategoriaProductoRepository;

    marcaRepository = {
      findById: jest.fn(async () => (marcaExiste ? ({ id: 'ma1' } as brands) : null)),
    } as unknown as MarcaRepository;

    modeloProductoRepository = {
      findById: jest.fn(async () => modeloExistente),
    } as unknown as ModeloProductoRepository;

    empresaLookupRepository = {
      existeEmpresa: jest.fn(async () => empresaValida),
    } as unknown as EmpresaLookupRepository;
  });

  function buildService(): ProductosService {
    return new ProductosService(
      productoRepository,
      unidadMedidaRepository,
      categoriaProductoRepository,
      marcaRepository,
      modeloProductoRepository,
      empresaLookupRepository,
    );
  }

  const inputBase = {
    companyId: 'company-1',
    sku: 'SKU-2',
    productType: 'good' as const,
    baseUnitId: 'u1',
    costingMethod: 'average' as const,
    tracksSerial: false,
    tracksLot: false,
  };

  it('crear: rechaza si la empresa no existe', async () => {
    empresaValida = false;
    await expect(buildService().crear(CONTEXT, inputBase)).rejects.toThrow(
      EmpresaInvalidaException,
    );
  });

  it('crear: rechaza si la unidad de medida no existe', async () => {
    unidadExiste = false;
    await expect(buildService().crear(CONTEXT, inputBase)).rejects.toThrow(
      UnidadMedidaInvalidaException,
    );
  });

  it('crear: rechaza si la categoría indicada no existe', async () => {
    categoriaExiste = false;
    await expect(
      buildService().crear(CONTEXT, { ...inputBase, categoryId: 'cat-x' }),
    ).rejects.toThrow(CategoriaInvalidaException);
  });

  it('crear: rechaza si la marca indicada no existe', async () => {
    marcaExiste = false;
    await expect(buildService().crear(CONTEXT, { ...inputBase, brandId: 'ma-x' })).rejects.toThrow(
      MarcaInvalidaException,
    );
  });

  it('crear: rechaza si el modelo indicado no existe', async () => {
    modeloExistente = null;
    await expect(
      buildService().crear(CONTEXT, { ...inputBase, brandId: 'ma1', modelId: 'mo-x' }),
    ).rejects.toThrow(ModeloInvalidoException);
  });

  it('crear: rechaza si el modelo no pertenece a la marca indicada', async () => {
    modeloExistente = { id: 'mo1', brand_id: 'ma-otra' } as product_models;
    await expect(
      buildService().crear(CONTEXT, { ...inputBase, brandId: 'ma1', modelId: 'mo1' }),
    ).rejects.toThrow(ModeloNoPerteneceAMarcaException);
  });

  it('crear: caso feliz con categoría/marca/modelo consistentes', async () => {
    const producto = await buildService().crear(CONTEXT, {
      ...inputBase,
      categoryId: 'cat1',
      brandId: 'ma1',
      modelId: 'mo1',
    });
    expect(producto.sku).toBe('SKU-2');
    expect(producto.model_id).toBe('mo1');
  });

  it('crear: un producto "service" que rastrea serie es rechazado por la entidad', async () => {
    await expect(
      buildService().crear(CONTEXT, { ...inputBase, productType: 'service', tracksSerial: true }),
    ).rejects.toThrow('no puede rastrear serie ni lote');
  });

  it('obtener: producto inexistente lanza ProductoNoEncontradoException', async () => {
    await expect(buildService().obtener(CONTEXT, 'no-existe')).rejects.toThrow(
      ProductoNoEncontradoException,
    );
  });

  it('listar: filtra por categoryId', async () => {
    productos.set('p2', buildProducto({ id: 'p2', category_id: 'cat2' }));
    const resultado = await buildService().listar(CONTEXT, undefined, { page: 1, pageSize: 20 });
    expect(resultado.data).toHaveLength(2);
  });

  it('actualizar: PATCH parcial no reasigna sku ni baseUnitId', async () => {
    const producto = await buildService().actualizar(CONTEXT, 'p1', { listPrice: 99.9 });
    expect(producto.sku).toBe('SKU-1');
    expect(producto.list_price).toBe(99.9);
  });

  it('actualizar: rechaza un PATCH que deja tracksSerial y tracksLot en true combinados (I4)', async () => {
    productos.set('p1', buildProducto({ tracks_serial: true, tracks_lot: false }));
    await expect(buildService().actualizar(CONTEXT, 'p1', { tracksLot: true })).rejects.toThrow(
      'invariante I4',
    );
  });

  it('actualizar: valida el modelo contra la marca ya guardada si no se manda brandId nuevo', async () => {
    productos.set('p1', buildProducto({ brand_id: 'ma-otra' }));
    modeloExistente = { id: 'mo1', brand_id: 'ma1' } as product_models;
    await expect(buildService().actualizar(CONTEXT, 'p1', { modelId: 'mo1' })).rejects.toThrow(
      ModeloNoPerteneceAMarcaException,
    );
  });
});
