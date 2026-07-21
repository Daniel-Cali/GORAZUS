import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { branches } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { SucursalRepository } from '../repositories/sucursal.repository';
import { EmpresaRepository } from '../repositories/empresa.repository';
import { Sucursal } from '../entities/sucursal.entity';
import type { CrearSucursalInput, ActualizarSucursalInput } from '../validators/sucursales.schema';

export class SucursalNoEncontradaException extends DomainException {
  constructor(id: string) {
    super('SUCURSAL_NO_ENCONTRADA', `No existe la sucursal "${id}".`, 404);
  }
}

export class EmpresaInvalidaException extends DomainException {
  constructor(companyId: string) {
    super('EMPRESA_INVALIDA', `No existe la empresa "${companyId}".`, 400);
  }
}

/** CRUD de sucursales — toda sucursal pertenece a una empresa ya existente (docs/architecture/14-modulo-core.md). */
@Injectable()
export class SucursalesService {
  constructor(
    private readonly sucursalRepository: SucursalRepository,
    private readonly empresaRepository: EmpresaRepository,
  ) {}

  async crear(context: UserContext, input: CrearSucursalInput): Promise<branches> {
    new Sucursal('pendiente', input.companyId, input.name, input.code, input.isMainBranch); // valida invariantes antes de tocar la base

    const empresa = await this.empresaRepository.findById(context, { id: input.companyId });
    if (!empresa) throw new EmpresaInvalidaException(input.companyId);

    return this.sucursalRepository.create(context, {
      tenant_id: context.tenantId,
      company_id: input.companyId,
      name: input.name,
      code: input.code,
      is_main_branch: input.isMainBranch,
      address_line: input.addressLine,
      phone: input.phone,
    });
  }

  async listar(
    context: UserContext,
    companyId: string | undefined,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<branches>> {
    return this.sucursalRepository.findMany(
      context,
      companyId ? { company_id: companyId } : {},
      pagination,
    );
  }

  async obtener(context: UserContext, id: string): Promise<branches> {
    const sucursal = await this.sucursalRepository.findById(context, { id });
    if (!sucursal) throw new SucursalNoEncontradaException(id);
    return sucursal;
  }

  async actualizar(
    context: UserContext,
    id: string,
    input: ActualizarSucursalInput,
  ): Promise<branches> {
    await this.obtener(context, id);
    return this.sucursalRepository.update(
      context,
      { id },
      {
        name: input.name,
        code: input.code,
        is_main_branch: input.isMainBranch,
        address_line: input.addressLine,
        phone: input.phone,
      },
    );
  }
}
