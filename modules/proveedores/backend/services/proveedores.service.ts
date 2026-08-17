import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { suppliers } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { ProveedorRepository } from '../repositories/proveedor.repository';
import { EmpresaLookupRepository } from '../repositories/empresa-lookup.repository';
import { SupplierBlockHistoryRepository } from '../repositories/supplier-block-history.repository';
import { Proveedor } from '../entities/proveedor.entity';
import type {
  CrearProveedorInput,
  ActualizarProveedorInput,
} from '../validators/proveedores.schema';

export class ProveedorNoEncontradoException extends DomainException {
  constructor(id: string) {
    super('PROVEEDOR_NO_ENCONTRADO', `No existe el proveedor "${id}".`, 404);
  }
}

export class EmpresaInvalidaException extends DomainException {
  constructor(companyId: string) {
    super('EMPRESA_INVALIDA', `No existe la empresa "${companyId}".`, 400);
  }
}

export class ProveedorYaBloqueadoException extends DomainException {
  constructor(id: string) {
    super('PROVEEDOR_YA_BLOQUEADO', `El proveedor "${id}" ya está bloqueado.`, 409);
  }
}

export class ProveedorNoBloqueadoException extends DomainException {
  constructor(id: string) {
    super('PROVEEDOR_NO_BLOQUEADO', `El proveedor "${id}" no está bloqueado.`, 409);
  }
}

/**
 * CRUD de proveedores + bloqueo/desbloqueo — maestro único de
 * `suppliers.suppliers` (`docs/database/logico/04-suppliers.md`).
 * Alcance de esta parte: el proveedor base y su estado de bloqueo, sin
 * contactos/direcciones/cuentas bancarias/crédito/evaluaciones/
 * clasificación/contratos — eso queda para una parte siguiente.
 */
@Injectable()
export class ProveedoresService {
  constructor(
    private readonly proveedorRepository: ProveedorRepository,
    private readonly empresaLookupRepository: EmpresaLookupRepository,
    private readonly supplierBlockHistoryRepository: SupplierBlockHistoryRepository,
  ) {}

  async crear(context: UserContext, input: CrearProveedorInput): Promise<suppliers> {
    new Proveedor('pendiente', input.legalName, input.taxId, input.paymentTermsDays, false); // valida invariantes antes de tocar la base

    const empresaValida = await this.empresaLookupRepository.existeEmpresa(
      context,
      input.companyId,
    );
    if (!empresaValida) throw new EmpresaInvalidaException(input.companyId);

    return this.proveedorRepository.create(context, {
      tenant_id: context.tenantId,
      company_id: input.companyId,
      branch_id: context.branchId,
      legal_name: input.legalName,
      trade_name: input.tradeName ?? null,
      tax_id: input.taxId,
      payment_terms_days: input.paymentTermsDays,
    });
  }

  async listar(
    context: UserContext,
    isBlocked: boolean | undefined,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<suppliers>> {
    return this.proveedorRepository.findMany(
      context,
      isBlocked === undefined ? {} : { is_blocked: isBlocked },
      pagination,
    );
  }

  async obtener(context: UserContext, id: string): Promise<suppliers> {
    const proveedor = await this.proveedorRepository.findById(context, { id });
    if (!proveedor) throw new ProveedorNoEncontradoException(id);
    return proveedor;
  }

  async actualizar(
    context: UserContext,
    id: string,
    input: ActualizarProveedorInput,
  ): Promise<suppliers> {
    const actual = await this.obtener(context, id);

    // PATCH parcial — reconstruye el estado COMBINADO (actual + cambios)
    // antes de persistir, mismo criterio que ProductosService.actualizar
    // (ISSUE-01): un solo campo tocado no debe poder dejar la entidad en
    // un estado inválido sin que nada lo detecte.
    new Proveedor(
      actual.id,
      input.legalName ?? actual.legal_name,
      actual.tax_id,
      input.paymentTermsDays ?? actual.payment_terms_days,
      actual.is_blocked,
    );

    return this.proveedorRepository.update(
      context,
      { id },
      {
        ...(input.legalName !== undefined && { legal_name: input.legalName }),
        ...(input.tradeName !== undefined && { trade_name: input.tradeName }),
        ...(input.paymentTermsDays !== undefined && {
          payment_terms_days: input.paymentTermsDays,
        }),
      },
    );
  }

  async bloquear(context: UserContext, id: string, reason: string | null): Promise<suppliers> {
    const actual = await this.obtener(context, id);
    if (actual.is_blocked) throw new ProveedorYaBloqueadoException(id);

    const bloqueado = await this.proveedorRepository.update(
      context,
      { id },
      { is_blocked: true, block_reason: reason },
    );
    await this.supplierBlockHistoryRepository.registrar(context, {
      supplierId: id,
      companyId: actual.company_id,
      branchId: actual.branch_id,
      action: 'blocked',
      reason,
    });
    return bloqueado;
  }

  async desbloquear(context: UserContext, id: string, reason: string | null): Promise<suppliers> {
    const actual = await this.obtener(context, id);
    if (!actual.is_blocked) throw new ProveedorNoBloqueadoException(id);

    const desbloqueado = await this.proveedorRepository.update(
      context,
      { id },
      { is_blocked: false, block_reason: null },
    );
    await this.supplierBlockHistoryRepository.registrar(context, {
      supplierId: id,
      companyId: actual.company_id,
      branchId: actual.branch_id,
      action: 'unblocked',
      reason,
    });
    return desbloqueado;
  }
}
