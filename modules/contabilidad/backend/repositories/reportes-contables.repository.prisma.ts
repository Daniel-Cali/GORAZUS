import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_ACCOUNTING, withTenantScope } from '@gorazus/core-database';
import type { AccountingPrismaClient } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import {
  ReportesContablesRepository,
  type SaldoPorCuenta,
  type MovimientoCuentaEfectivo,
} from './reportes-contables.repository';

/**
 * `jes.code IN ('posted', 'reversed')`, nunca solo `'posted'` — un
 * asiento revertido (`AsientosService.revertir`) sigue siendo un hecho
 * histórico real: sus líneas deben seguir contando en los reportes,
 * la reversión es un asiento NUEVO con los montos invertidos que las
 * cancela, no un borrado del original. Filtrar solo por `'posted'`
 * excluiría el asiento original pero no su reversión (que sí quedó
 * `posted`), rompiendo la ecuación contable — descubierto y corregido
 * en la verificación manual end-to-end de esta misma parte.
 */
@Injectable()
export class ReportesContablesRepositoryPrisma extends ReportesContablesRepository {
  constructor(@Inject(PRISMA_ACCOUNTING) private readonly client: AccountingPrismaClient) {
    super();
  }

  async saldosPorTipo(
    context: UserContext,
    params: { companyId: string; branchId?: string; accountTypeCodes: string[]; fechaCorte: Date },
  ): Promise<SaldoPorCuenta[]> {
    return withTenantScope(
      this.client,
      context,
      (tx) =>
        tx.$queryRaw<SaldoPorCuenta[]>`
        SELECT coa.id AS "accountId", coa.code, coa.name,
               at.code AS "accountTypeCode", at.normal_balance AS "normalBalance",
               COALESCE(SUM(jel.debit_amount), 0)::text AS "totalDebit",
               COALESCE(SUM(jel.credit_amount), 0)::text AS "totalCredit"
        FROM accounting.chart_of_accounts coa
        JOIN accounting.account_types at ON at.id = coa.account_type_id
        LEFT JOIN accounting.journal_entry_lines jel
          ON jel.account_id = coa.id AND jel.deleted_at IS NULL
        LEFT JOIN accounting.journal_entries je
          ON je.id = jel.journal_entry_id AND je.deleted_at IS NULL
          AND je.posting_date <= ${params.fechaCorte}::date
          AND (${params.branchId ?? null}::uuid IS NULL OR je.branch_id = ${params.branchId ?? null}::uuid)
        LEFT JOIN accounting.journal_entry_status jes
          ON jes.id = je.status_id AND jes.code IN ('posted', 'reversed')
        WHERE coa.company_id = ${params.companyId}::uuid
          AND coa.deleted_at IS NULL
          AND at.code = ANY(${params.accountTypeCodes}::text[])
          AND (jel.id IS NULL OR jes.id IS NOT NULL)
        GROUP BY coa.id, coa.code, coa.name, at.code, at.normal_balance
        ORDER BY coa.code
      `,
    );
  }

  async saldosPorTipoEnRango(
    context: UserContext,
    params: {
      companyId: string;
      branchId?: string;
      accountTypeCodes: string[];
      desde: Date;
      hasta: Date;
    },
  ): Promise<SaldoPorCuenta[]> {
    return withTenantScope(
      this.client,
      context,
      (tx) =>
        tx.$queryRaw<SaldoPorCuenta[]>`
        SELECT coa.id AS "accountId", coa.code, coa.name,
               at.code AS "accountTypeCode", at.normal_balance AS "normalBalance",
               COALESCE(SUM(jel.debit_amount), 0)::text AS "totalDebit",
               COALESCE(SUM(jel.credit_amount), 0)::text AS "totalCredit"
        FROM accounting.chart_of_accounts coa
        JOIN accounting.account_types at ON at.id = coa.account_type_id
        LEFT JOIN accounting.journal_entry_lines jel
          ON jel.account_id = coa.id AND jel.deleted_at IS NULL
        LEFT JOIN accounting.journal_entries je
          ON je.id = jel.journal_entry_id AND je.deleted_at IS NULL
          AND je.posting_date >= ${params.desde}::date AND je.posting_date <= ${params.hasta}::date
          AND (${params.branchId ?? null}::uuid IS NULL OR je.branch_id = ${params.branchId ?? null}::uuid)
        LEFT JOIN accounting.journal_entry_status jes
          ON jes.id = je.status_id AND jes.code IN ('posted', 'reversed')
        WHERE coa.company_id = ${params.companyId}::uuid
          AND coa.deleted_at IS NULL
          AND at.code = ANY(${params.accountTypeCodes}::text[])
          AND (jel.id IS NULL OR jes.id IS NOT NULL)
        GROUP BY coa.id, coa.code, coa.name, at.code, at.normal_balance
        ORDER BY coa.code
      `,
    );
  }

  async movimientoNetoCuentasEfectivo(
    context: UserContext,
    params: {
      companyId: string;
      branchId?: string;
      cashAccountIds: string[];
      desde: Date;
      hasta: Date;
    },
  ): Promise<MovimientoCuentaEfectivo[]> {
    return withTenantScope(
      this.client,
      context,
      (tx) =>
        tx.$queryRaw<MovimientoCuentaEfectivo[]>`
        SELECT je.source_module AS "sourceModule",
               COALESCE(SUM(jel.debit_amount - jel.credit_amount), 0)::text AS "netChange"
        FROM accounting.journal_entry_lines jel
        JOIN accounting.journal_entries je ON je.id = jel.journal_entry_id
        JOIN accounting.journal_entry_status jes ON jes.id = je.status_id
        WHERE jel.account_id = ANY(${params.cashAccountIds}::uuid[])
          AND je.company_id = ${params.companyId}::uuid
          AND jel.deleted_at IS NULL AND je.deleted_at IS NULL
          AND jes.code IN ('posted', 'reversed')
          AND je.posting_date >= ${params.desde}::date AND je.posting_date <= ${params.hasta}::date
          AND (${params.branchId ?? null}::uuid IS NULL OR je.branch_id = ${params.branchId ?? null}::uuid)
        GROUP BY je.source_module
        ORDER BY je.source_module
      `,
    );
  }
}
