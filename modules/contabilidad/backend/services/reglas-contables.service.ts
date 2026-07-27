import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { accounting_rules } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import {
  ReglaContableRepository,
  type ReglaContableParams,
  type ReglaConLineas,
} from '../repositories/regla-contable.repository';
import { CuentaContableRepository } from '../repositories/cuenta-contable.repository';

export class ReglaContableNoEncontradaException extends DomainException {
  constructor(id: string) {
    super('REGLA_CONTABLE_NO_ENCONTRADA', `No existe la regla contable "${id}".`, 404);
  }
}

export class ReglaContableSinLineasException extends DomainException {
  constructor() {
    super('REGLA_CONTABLE_SIN_LINEAS', 'Una regla contable debe tener al menos 2 líneas.', 400);
  }
}

export class CuentaDeReglaInvalidaException extends DomainException {
  constructor(accountId: string) {
    super('CUENTA_DE_REGLA_INVALIDA', `La cuenta "${accountId}" de la regla no existe.`, 400);
  }
}

/**
 * Reglas contables (`accounting.accounting_rules`/`accounting_rule_lines`)
 * — cada regla asocia un `event_code` (ej. `ventas.factura.confirmada`)
 * con las líneas de asiento a generar. `amount_formula` es el NOMBRE de
 * un campo dentro del "hecho contable" que dispara el evento (ej.
 * `subtotal_amount`, `tax_amount`), NUNCA una expresión evaluada — ver
 * `MotorContableService` para el porqué (riesgo de ejecución de código
 * arbitrario si `amount_formula` se evaluara como código).
 */
@Injectable()
export class ReglasContablesService {
  constructor(
    private readonly reglaContableRepository: ReglaContableRepository,
    private readonly cuentaContableRepository: CuentaContableRepository,
  ) {}

  private async validarCuentasDeLasLineas(
    context: UserContext,
    lines: ReglaContableParams['lines'],
  ): Promise<void> {
    if (lines.length < 2) throw new ReglaContableSinLineasException();
    for (const line of lines) {
      const cuenta = await this.cuentaContableRepository.findById(context, {
        id: line.accountId,
      });
      if (!cuenta) throw new CuentaDeReglaInvalidaException(line.accountId);
    }
  }

  async crear(context: UserContext, params: ReglaContableParams): Promise<ReglaConLineas> {
    await this.validarCuentasDeLasLineas(context, params.lines);
    return this.reglaContableRepository.crear(context, params);
  }

  async obtener(context: UserContext, id: string): Promise<ReglaConLineas> {
    const regla = await this.reglaContableRepository.obtener(context, id);
    if (!regla) throw new ReglaContableNoEncontradaException(id);
    return regla;
  }

  async listar(
    context: UserContext,
    companyId: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<accounting_rules>> {
    return this.reglaContableRepository.listar(context, { company_id: companyId }, pagination);
  }

  async actualizar(
    context: UserContext,
    id: string,
    params: ReglaContableParams,
  ): Promise<ReglaConLineas> {
    await this.obtener(context, id);
    await this.validarCuentasDeLasLineas(context, params.lines);
    return this.reglaContableRepository.actualizar(context, id, params);
  }

  async eliminar(context: UserContext, id: string): Promise<accounting_rules> {
    await this.obtener(context, id);
    return this.reglaContableRepository.eliminar(context, id);
  }
}
