import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { product_models } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { ModeloProductoRepository } from '../repositories/modelo-producto.repository';
import { MarcaRepository } from '../repositories/marca.repository';
import { EmpresaLookupRepository } from '../repositories/empresa-lookup.repository';
import { ModeloProducto } from '../entities/modelo-producto.entity';
import type {
  CrearModeloProductoInput,
  ActualizarModeloProductoInput,
} from '../validators/modelos-producto.schema';

export class ModeloProductoNoEncontradoException extends DomainException {
  constructor(id: string) {
    super('MODELO_PRODUCTO_NO_ENCONTRADO', `No existe el modelo "${id}".`, 404);
  }
}

export class EmpresaInvalidaException extends DomainException {
  constructor(companyId: string) {
    super('EMPRESA_INVALIDA', `No existe la empresa "${companyId}".`, 400);
  }
}

export class MarcaInvalidaException extends DomainException {
  constructor(brandId: string) {
    super('MARCA_INVALIDA', `No existe la marca "${brandId}".`, 400);
  }
}

/** CRUD de modelos — todo modelo pertenece a una marca ya existente, `brandId` obligatorio (docs/architecture/18-modulo-products.md §4). */
@Injectable()
export class ModelosProductoService {
  constructor(
    private readonly modeloProductoRepository: ModeloProductoRepository,
    private readonly marcaRepository: MarcaRepository,
    private readonly empresaLookupRepository: EmpresaLookupRepository,
  ) {}

  async crear(context: UserContext, input: CrearModeloProductoInput): Promise<product_models> {
    new ModeloProducto('pendiente', input.brandId, input.name); // valida invariantes antes de tocar la base

    const empresaValida = await this.empresaLookupRepository.existeEmpresa(
      context,
      input.companyId,
    );
    if (!empresaValida) throw new EmpresaInvalidaException(input.companyId);

    const marca = await this.marcaRepository.findById(context, { id: input.brandId });
    if (!marca) throw new MarcaInvalidaException(input.brandId);

    return this.modeloProductoRepository.create(context, {
      tenant_id: context.tenantId,
      company_id: input.companyId,
      branch_id: context.branchId,
      brand_id: input.brandId,
      name: input.name,
    });
  }

  async listar(
    context: UserContext,
    brandId: string | undefined,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<product_models>> {
    return this.modeloProductoRepository.findMany(
      context,
      brandId ? { brand_id: brandId } : {},
      pagination,
    );
  }

  async obtener(context: UserContext, id: string): Promise<product_models> {
    const modelo = await this.modeloProductoRepository.findById(context, { id });
    if (!modelo) throw new ModeloProductoNoEncontradoException(id);
    return modelo;
  }

  async actualizar(
    context: UserContext,
    id: string,
    input: ActualizarModeloProductoInput,
  ): Promise<product_models> {
    await this.obtener(context, id);
    return this.modeloProductoRepository.update(
      context,
      { id },
      { ...(input.name !== undefined && { name: input.name }) },
    );
  }
}
