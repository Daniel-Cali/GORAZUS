import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { product_categories } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { CategoriaProductoRepository } from '../repositories/categoria-producto.repository';
import { EmpresaLookupRepository } from '../repositories/empresa-lookup.repository';
import { CategoriaProducto } from '../entities/categoria-producto.entity';
import type {
  CrearCategoriaProductoInput,
  ActualizarCategoriaProductoInput,
} from '../validators/categorias-producto.schema';

export class CategoriaProductoNoEncontradaException extends DomainException {
  constructor(id: string) {
    super('CATEGORIA_PRODUCTO_NO_ENCONTRADA', `No existe la categoría "${id}".`, 404);
  }
}

export class EmpresaInvalidaException extends DomainException {
  constructor(companyId: string) {
    super('EMPRESA_INVALIDA', `No existe la empresa "${companyId}".`, 400);
  }
}

export class CategoriaPadreInvalidaException extends DomainException {
  constructor(parentCategoryId: string) {
    super('CATEGORIA_PADRE_INVALIDA', `No existe la categoría padre "${parentCategoryId}".`, 400);
  }
}

/** CRUD de categorías de producto — jerárquica auto-referenciada de N niveles (docs/architecture/18-modulo-products.md §2). */
@Injectable()
export class CategoriasProductoService {
  constructor(
    private readonly categoriaProductoRepository: CategoriaProductoRepository,
    private readonly empresaLookupRepository: EmpresaLookupRepository,
  ) {}

  async crear(
    context: UserContext,
    input: CrearCategoriaProductoInput,
  ): Promise<product_categories> {
    new CategoriaProducto('pendiente', input.code, input.parentCategoryId ?? null); // valida invariantes antes de tocar la base

    const empresaValida = await this.empresaLookupRepository.existeEmpresa(
      context,
      input.companyId,
    );
    if (!empresaValida) throw new EmpresaInvalidaException(input.companyId);

    if (input.parentCategoryId) {
      const padre = await this.categoriaProductoRepository.findById(context, {
        id: input.parentCategoryId,
      });
      if (!padre) throw new CategoriaPadreInvalidaException(input.parentCategoryId);
    }

    return this.categoriaProductoRepository.create(context, {
      tenant_id: context.tenantId,
      company_id: input.companyId,
      branch_id: context.branchId,
      code: input.code,
      parent_category_id: input.parentCategoryId ?? null,
    });
  }

  async listar(
    context: UserContext,
    parentCategoryId: string | undefined,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<product_categories>> {
    return this.categoriaProductoRepository.findMany(
      context,
      parentCategoryId ? { parent_category_id: parentCategoryId } : {},
      pagination,
    );
  }

  async obtener(context: UserContext, id: string): Promise<product_categories> {
    const categoria = await this.categoriaProductoRepository.findById(context, { id });
    if (!categoria) throw new CategoriaProductoNoEncontradaException(id);
    return categoria;
  }

  async actualizar(
    context: UserContext,
    id: string,
    input: ActualizarCategoriaProductoInput,
  ): Promise<product_categories> {
    await this.obtener(context, id);
    return this.categoriaProductoRepository.update(
      context,
      { id },
      { ...(input.code !== undefined && { code: input.code }) },
    );
  }
}
