import { BaseRepository } from '@gorazus/core-database';
import type {
  AccountingPrisma,
  AccountingPrismaClient,
  fiscal_periods,
} from '@gorazus/core-database';

/** Adaptador sobre `accounting.fiscal_periods` — el período que contiene una fecha se resuelve con `findMany({ starts_on: lte, ends_on: gte })`, no hace falta un método propio. */
export abstract class PeriodoFiscalRepository extends BaseRepository<
  AccountingPrisma.fiscal_periodsWhereUniqueInput,
  AccountingPrisma.fiscal_periodsWhereInput,
  AccountingPrisma.fiscal_periodsUncheckedCreateInput,
  AccountingPrisma.fiscal_periodsUncheckedUpdateInput,
  fiscal_periods,
  AccountingPrismaClient
> {}
