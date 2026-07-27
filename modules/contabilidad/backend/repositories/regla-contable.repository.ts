import type {
  AccountingPrisma,
  accounting_rules,
  accounting_rule_lines,
} from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

export interface LineaReglaParams {
  accountId: string;
  entrySide: 'debit' | 'credit';
  amountFormula: string;
}

export interface ReglaContableParams {
  companyId: string;
  branchId?: string | null;
  eventCode: string;
  lines: LineaReglaParams[];
}

export type ReglaConLineas = accounting_rules & { accounting_rule_lines: accounting_rule_lines[] };

/**
 * `accounting.accounting_rules`/`accounting_rule_lines` — el motor de
 * reglas configurable (`accounting_rule_lines` SÍ tiene relación real
 * de Prisma hacia `accounting_rules`, a diferencia de `invoice_lines`/
 * `invoices`, así que acepta `create` anidado en una sola escritura).
 */
export abstract class ReglaContableRepository {
  abstract crear(context: UserContext, params: ReglaContableParams): Promise<ReglaConLineas>;

  abstract obtener(context: UserContext, id: string): Promise<ReglaConLineas | null>;

  /** Regla activa para un `event_code` + empresa — usada por `MotorContableService`. Si hay varias activas, se toma la más reciente. */
  abstract buscarPorEvento(
    context: UserContext,
    eventCode: string,
    companyId: string,
  ): Promise<ReglaConLineas | null>;

  abstract listar(
    context: UserContext,
    filter: AccountingPrisma.accounting_rulesWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<accounting_rules>>;

  abstract actualizar(
    context: UserContext,
    id: string,
    params: ReglaContableParams,
  ): Promise<ReglaConLineas>;

  abstract eliminar(context: UserContext, id: string): Promise<accounting_rules>;
}
