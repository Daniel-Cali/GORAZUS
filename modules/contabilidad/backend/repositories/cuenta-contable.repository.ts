import { BaseRepository } from '@gorazus/core-database';
import type {
  AccountingPrisma,
  AccountingPrismaClient,
  chart_of_accounts,
} from '@gorazus/core-database';

/** Adaptador sobre `accounting.chart_of_accounts` — plan de cuentas, jerarquía vía `parent_account_id` auto-referenciado. */
export abstract class CuentaContableRepository extends BaseRepository<
  AccountingPrisma.chart_of_accountsWhereUniqueInput,
  AccountingPrisma.chart_of_accountsWhereInput,
  AccountingPrisma.chart_of_accountsUncheckedCreateInput,
  AccountingPrisma.chart_of_accountsUncheckedUpdateInput,
  chart_of_accounts,
  AccountingPrismaClient
> {}
