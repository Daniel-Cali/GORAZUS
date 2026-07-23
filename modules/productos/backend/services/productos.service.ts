import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { products } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { ProductoRepository } from '../repositories/producto.repository';
import { UnidadMedidaRepository } from '../repositories/unidad-medida.repository';
import { CategoriaProductoRepository } from '../repositories/categoria-producto.repository';
import { MarcaRepository } from '../repositories/marca.repository';
import { ModeloProductoRepository } from '../repositories/modelo-producto.repository';
import { EmpresaLookupRepository } from '../repositories/empresa-lookup.repository';
import { Producto } from '../entities/producto.entity';
import type { CrearProductoInput, ActualizarProductoInput } from '../validators/productos.schema';

export class ProductoNoEncontradoException extends DomainException {
  constructor(id: string) {
    super('PRODUCTO_NO_ENCONTRADO', `No existe el producto "${id}".`, 404);
  }
}

export class EmpresaInvalidaException extends DomainException {
  constructor(companyId: string) {
    super('EMPRESA_INVALIDA', `No existe la empresa "${companyId}".`, 400);
  }
}

export class UnidadMedidaInvalidaException extends DomainException {
  constructor(baseUnitId: string) {
    super('UNIDAD_MEDIDA_INVALIDA', `No existe la unidad de medida "${baseUnitId}".`, 400);
  }
}

export class CategoriaInvalidaException extends DomainException {
  constructor(categoryId: string) {
    super('CATEGORIA_INVALIDA', `No existe la categoría "${categoryId}".`, 400);
  }
}

export class MarcaInvalidaException extends DomainException {
  constructor(brandId: string) {
    super('MARCA_INVALIDA', `No existe la marca "${brandId}".`, 400);
  }
}

export class ModeloInvalidoException extends DomainException {
  constructor(modelId: string) {
    super('MODELO_INVALIDO', `No existe el modelo "${modelId}".`, 400);
  }
}

export class ModeloNoPerteneceAMarcaException extends DomainException {
  constructor(modelId: string, brandId: string) {
    super(
      'MODELO_NO_PERTENECE_A_MARCA',
      `El modelo "${modelId}" no pertenece a la marca "${brandId}".`,
      400,
    );
  }
}

/**
 * CRUD de productos — entidad central del módulo
 * (docs/architecture/18-modulo-products.md §1). Alcance de esta parte:
 * el producto base (`good`/`service`/`kit`/`combo`/`composite`), sin
 * variantes (`parent_product_id`, flujo de creación propio §5), sin
 * combos/kits/BOM (tablas de composición aparte, §10-11), sin imágenes/
 * atributos/códigos de barra — todo eso queda para una parte siguiente,
 * ver `PRODUCTOS_REPORT.md §4`.
 */
@Injectable()
export class ProductosService {
  constructor(
    private readonly productoRepository: ProductoRepository,
    private readonly unidadMedidaRepository: UnidadMedidaRepository,
    private readonly categoriaProductoRepository: CategoriaProductoRepository,
    private readonly marcaRepository: MarcaRepository,
    private readonly modeloProductoRepository: ModeloProductoRepository,
    private readonly empresaLookupRepository: EmpresaLookupRepository,
  ) {}

  async crear(context: UserContext, input: CrearProductoInput): Promise<products> {
    new Producto(
      'pendiente',
      input.sku,
      input.productType,
      input.baseUnitId,
      input.costingMethod,
      input.tracksSerial,
      input.tracksLot,
    ); // valida invariantes antes de tocar la base

    const empresaValida = await this.empresaLookupRepository.existeEmpresa(
      context,
      input.companyId,
    );
    if (!empresaValida) throw new EmpresaInvalidaException(input.companyId);

    const unidad = await this.unidadMedidaRepository.findById(context, { id: input.baseUnitId });
    if (!unidad) throw new UnidadMedidaInvalidaException(input.baseUnitId);

    if (input.categoryId) {
      const categoria = await this.categoriaProductoRepository.findById(context, {
        id: input.categoryId,
      });
      if (!categoria) throw new CategoriaInvalidaException(input.categoryId);
    }

    if (input.brandId) {
      const marca = await this.marcaRepository.findById(context, { id: input.brandId });
      if (!marca) throw new MarcaInvalidaException(input.brandId);
    }

    if (input.modelId) {
      await this.validarModelo(context, input.modelId, input.brandId);
    }

    return this.productoRepository.create(context, {
      tenant_id: context.tenantId,
      company_id: input.companyId,
      branch_id: context.branchId,
      sku: input.sku,
      product_type: input.productType,
      base_unit_id: input.baseUnitId,
      category_id: input.categoryId ?? null,
      brand_id: input.brandId ?? null,
      model_id: input.modelId ?? null,
      costing_method: input.costingMethod,
      tracks_serial: input.tracksSerial,
      tracks_lot: input.tracksLot,
      standard_cost: input.standardCost,
      list_price: input.listPrice,
    });
  }

  async listar(
    context: UserContext,
    categoryId: string | undefined,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<products>> {
    return this.productoRepository.findMany(
      context,
      categoryId ? { category_id: categoryId } : {},
      pagination,
    );
  }

  async obtener(context: UserContext, id: string): Promise<products> {
    const producto = await this.productoRepository.findById(context, { id });
    if (!producto) throw new ProductoNoEncontradoException(id);
    return producto;
  }

  async actualizar(
    context: UserContext,
    id: string,
    input: ActualizarProductoInput,
  ): Promise<products> {
    const actual = await this.obtener(context, id);

    if (input.categoryId) {
      const categoria = await this.categoriaProductoRepository.findById(context, {
        id: input.categoryId,
      });
      if (!categoria) throw new CategoriaInvalidaException(input.categoryId);
    }

    const brandId = input.brandId !== undefined ? input.brandId : (actual.brand_id ?? undefined);
    if (input.brandId) {
      const marca = await this.marcaRepository.findById(context, { id: input.brandId });
      if (!marca) throw new MarcaInvalidaException(input.brandId);
    }

    if (input.modelId) {
      await this.validarModelo(context, input.modelId, brandId);
    }

    return this.productoRepository.update(
      context,
      { id },
      {
        ...(input.categoryId !== undefined && { category_id: input.categoryId }),
        ...(input.brandId !== undefined && { brand_id: input.brandId }),
        ...(input.modelId !== undefined && { model_id: input.modelId }),
        ...(input.productType !== undefined && { product_type: input.productType }),
        ...(input.costingMethod !== undefined && { costing_method: input.costingMethod }),
        ...(input.tracksSerial !== undefined && { tracks_serial: input.tracksSerial }),
        ...(input.tracksLot !== undefined && { tracks_lot: input.tracksLot }),
        ...(input.standardCost !== undefined && { standard_cost: input.standardCost }),
        ...(input.listPrice !== undefined && { list_price: input.listPrice }),
      },
    );
  }

  /**
   * Consistencia marca↔modelo — señalada en el propio documento de
   * arquitectura como invariante "no reforzada hoy por CHECK cruzado"
   * (§4): si se indica `modelId`, ese modelo debe pertenecer a la marca
   * indicada (o a la marca ya guardada del producto, en una edición).
   */
  private async validarModelo(
    context: UserContext,
    modelId: string,
    brandId: string | undefined,
  ): Promise<void> {
    const modelo = await this.modeloProductoRepository.findById(context, { id: modelId });
    if (!modelo) throw new ModeloInvalidoException(modelId);
    if (brandId && modelo.brand_id !== brandId) {
      throw new ModeloNoPerteneceAMarcaException(modelId, brandId);
    }
  }
}
