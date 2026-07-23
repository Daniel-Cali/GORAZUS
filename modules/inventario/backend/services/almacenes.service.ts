import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { warehouses } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { AlmacenRepository } from '../repositories/almacen.repository';
import { EmpresaSucursalLookupRepository } from '../repositories/empresa-sucursal-lookup.repository';
import { Almacen } from '../entities/almacen.entity';
import type { CrearAlmacenInput, ActualizarAlmacenInput } from '../validators/almacenes.schema';

export class AlmacenNoEncontradoException extends DomainException {
  constructor(id: string) {
    super('ALMACEN_NO_ENCONTRADO', `No existe el almacén "${id}".`, 404);
  }
}

export class EmpresaInvalidaException extends DomainException {
  constructor(companyId: string) {
    super('EMPRESA_INVALIDA', `No existe la empresa "${companyId}".`, 400);
  }
}

export class SucursalInvalidaException extends DomainException {
  constructor(branchId: string, companyId: string) {
    super(
      'SUCURSAL_INVALIDA',
      `No existe la sucursal "${branchId}", o no pertenece a la empresa "${companyId}".`,
      400,
    );
  }
}

/**
 * CRUD de almacenes — todo almacén pertenece a una empresa y una
 * sucursal ya existentes (docs/architecture/19-modulo-inventory.md §1).
 * Sin `eliminar` a propósito, mismo alcance que `SucursalesService`
 * (`modules/configuracion/backend`) — baja lógica queda para cuando
 * haya un caso de uso real que la necesite (ej. impedir eliminar un
 * almacén con stock), no antes.
 */
@Injectable()
export class AlmacenesService {
  constructor(
    private readonly almacenRepository: AlmacenRepository,
    private readonly empresaSucursalLookupRepository: EmpresaSucursalLookupRepository,
  ) {}

  async crear(context: UserContext, input: CrearAlmacenInput): Promise<warehouses> {
    new Almacen(
      'pendiente',
      input.companyId,
      input.branchId,
      input.name,
      input.code,
      input.warehouseType,
    ); // valida invariantes antes de tocar la base

    const empresaValida = await this.empresaSucursalLookupRepository.existeEmpresa(
      context,
      input.companyId,
    );
    if (!empresaValida) throw new EmpresaInvalidaException(input.companyId);

    const sucursalValida = await this.empresaSucursalLookupRepository.existeSucursalDeEmpresa(
      context,
      input.branchId,
      input.companyId,
    );
    if (!sucursalValida) throw new SucursalInvalidaException(input.branchId, input.companyId);

    return this.almacenRepository.create(context, {
      tenant_id: context.tenantId,
      company_id: input.companyId,
      branch_id: input.branchId,
      name: input.name,
      code: input.code,
      warehouse_type: input.warehouseType,
    });
  }

  async listar(
    context: UserContext,
    branchId: string | undefined,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<warehouses>> {
    return this.almacenRepository.findMany(
      context,
      branchId ? { branch_id: branchId } : {},
      pagination,
    );
  }

  async obtener(context: UserContext, id: string): Promise<warehouses> {
    const almacen = await this.almacenRepository.findById(context, { id });
    if (!almacen) throw new AlmacenNoEncontradoException(id);
    return almacen;
  }

  async actualizar(
    context: UserContext,
    id: string,
    input: ActualizarAlmacenInput,
  ): Promise<warehouses> {
    await this.obtener(context, id);
    return this.almacenRepository.update(
      context,
      { id },
      {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.code !== undefined && { code: input.code }),
        ...(input.warehouseType !== undefined && { warehouse_type: input.warehouseType }),
      },
    );
  }
}
