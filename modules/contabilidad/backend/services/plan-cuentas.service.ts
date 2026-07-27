import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { chart_of_accounts, account_types } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { CuentaContableRepository } from '../repositories/cuenta-contable.repository';
import { TipoCuentaRepository } from '../repositories/tipo-cuenta.repository';
import { CuentaContable } from '../entities/cuenta-contable.entity';
import type {
  CrearCuentaContableInput,
  ActualizarCuentaContableInput,
} from '../validators/plan-cuentas.schema';

export class CuentaContableNoEncontradaException extends DomainException {
  constructor(id: string) {
    super('CUENTA_CONTABLE_NO_ENCONTRADA', `No existe la cuenta contable "${id}".`, 404);
  }
}

export class TipoCuentaInvalidoException extends DomainException {
  constructor(accountTypeId: string) {
    super('TIPO_CUENTA_INVALIDO', `No existe el tipo de cuenta "${accountTypeId}".`, 400);
  }
}

export class CuentaPadreInvalidaException extends DomainException {
  constructor(parentAccountId: string) {
    super(
      'CUENTA_PADRE_INVALIDA',
      `La cuenta padre "${parentAccountId}" no existe o no pertenece a la misma empresa.`,
      400,
    );
  }
}

export class CodigoCuentaDuplicadoException extends DomainException {
  constructor(code: string) {
    super(
      'CODIGO_CUENTA_DUPLICADO',
      `Ya existe una cuenta con el código "${code}" en esta empresa.`,
      409,
    );
  }
}

export class CuentaContableInvalidaException extends DomainException {
  constructor(mensaje: string) {
    super('CUENTA_CONTABLE_INVALIDA', mensaje, 400);
  }
}

/** El constructor de `CuentaContable` lanza `Error` plano (invariantes de forma) — sin este wrapper, el filtro global lo convierte en un 500 sin traducir en vez de un 400 limpio. */
function construirCuentaContable(
  code: string,
  name: string,
  accountTypeId: string,
  acceptsPostings: boolean,
  parentAccountId: string | null,
): void {
  try {
    new CuentaContable(code, name, accountTypeId, acceptsPostings, parentAccountId);
  } catch (error) {
    throw new CuentaContableInvalidaException(
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Plan de cuentas (`accounting.chart_of_accounts`) — jerárquico vía
 * `parent_account_id`, código único por empresa. `accepts_postings`
 * decide si la cuenta puede recibir líneas de asiento directamente
 * (una cuenta "de agrupación", con hijos, normalmente no las acepta,
 * pero esta regla la decide quien arma el plan de cuentas, no se
 * fuerza automáticamente — mismo criterio de flexibilidad que el resto
 * del pedido "completamente configurable").
 */
@Injectable()
export class PlanCuentasService {
  constructor(
    private readonly cuentaContableRepository: CuentaContableRepository,
    private readonly tipoCuentaRepository: TipoCuentaRepository,
  ) {}

  async crear(context: UserContext, input: CrearCuentaContableInput): Promise<chart_of_accounts> {
    construirCuentaContable(
      input.code,
      input.name,
      input.accountTypeId,
      input.acceptsPostings ?? true,
      input.parentAccountId ?? null,
    );

    const tipo = await this.tipoCuentaRepository.findById(context, { id: input.accountTypeId });
    if (!tipo) throw new TipoCuentaInvalidoException(input.accountTypeId);

    if (input.parentAccountId) {
      const padre = await this.cuentaContableRepository.findById(context, {
        id: input.parentAccountId,
      });
      if (!padre || padre.company_id !== input.companyId) {
        throw new CuentaPadreInvalidaException(input.parentAccountId);
      }
    }

    const existente = await this.cuentaContableRepository.findMany(
      context,
      { code: input.code, company_id: input.companyId },
      { page: 1, pageSize: 1 },
    );
    if (existente.data[0]) throw new CodigoCuentaDuplicadoException(input.code);

    return this.cuentaContableRepository.create(context, {
      tenant_id: context.tenantId,
      company_id: input.companyId,
      branch_id: input.branchId ?? null,
      code: input.code,
      name: input.name,
      account_type_id: input.accountTypeId,
      parent_account_id: input.parentAccountId ?? null,
      accepts_postings: input.acceptsPostings ?? true,
    });
  }

  async obtener(context: UserContext, id: string): Promise<chart_of_accounts> {
    const cuenta = await this.cuentaContableRepository.findById(context, { id });
    if (!cuenta) throw new CuentaContableNoEncontradaException(id);
    return cuenta;
  }

  async listar(
    context: UserContext,
    filtros: { companyId: string; accountTypeId?: string; parentAccountId?: string | null },
    pagination: PaginationParams,
  ): Promise<PaginatedResult<chart_of_accounts>> {
    return this.cuentaContableRepository.findMany(
      context,
      {
        company_id: filtros.companyId,
        ...(filtros.accountTypeId ? { account_type_id: filtros.accountTypeId } : {}),
        ...(filtros.parentAccountId !== undefined
          ? { parent_account_id: filtros.parentAccountId }
          : {}),
      },
      pagination,
    );
  }

  /** No permite reasignar `accountTypeId` — cambiar la naturaleza de una cuenta con historial rompe la comparabilidad de los reportes ya generados. */
  async actualizar(
    context: UserContext,
    id: string,
    input: ActualizarCuentaContableInput,
  ): Promise<chart_of_accounts> {
    const actual = await this.obtener(context, id);
    construirCuentaContable(
      input.code ?? actual.code,
      input.name ?? actual.name,
      actual.account_type_id,
      input.acceptsPostings ?? actual.accepts_postings,
      actual.parent_account_id,
    );

    if (input.code && input.code !== actual.code) {
      const existente = await this.cuentaContableRepository.findMany(
        context,
        { code: input.code, company_id: actual.company_id },
        { page: 1, pageSize: 1 },
      );
      if (existente.data[0]) throw new CodigoCuentaDuplicadoException(input.code);
    }

    return this.cuentaContableRepository.update(
      context,
      { id },
      {
        ...(input.code ? { code: input.code } : {}),
        ...(input.name ? { name: input.name } : {}),
        ...(input.acceptsPostings !== undefined ? { accepts_postings: input.acceptsPostings } : {}),
      },
    );
  }

  /**
   * Desactiva la cuenta (`is_active=false`), nunca baja lógica —
   * una cuenta del plan contable nunca se "elimina" en la práctica real
   * (rompería la trazabilidad de reportes históricos que ya la
   * referencian), se retira de uso desactivándola.
   */
  async desactivar(context: UserContext, id: string): Promise<chart_of_accounts> {
    await this.obtener(context, id);
    return this.cuentaContableRepository.update(context, { id }, { is_active: false });
  }

  /** Get-or-create idempotente por código — usado por el seed del plan de cuentas mínimo, mismo patrón que `VentasService.resolverEstadoPorCodigo`. */
  async resolverTipoPorCodigo(
    context: UserContext,
    code: string,
    normalBalance: 'debit' | 'credit',
  ): Promise<account_types> {
    const existente = await this.tipoCuentaRepository.findMany(
      context,
      { code },
      { page: 1, pageSize: 1 },
    );
    if (existente.data[0]) return existente.data[0];
    return this.tipoCuentaRepository.create(context, {
      tenant_id: context.tenantId,
      code,
      normal_balance: normalBalance,
    });
  }
}
