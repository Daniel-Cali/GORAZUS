import { BaseRepository } from '@gorazus/core-database';
import type {
  AccountingPrisma,
  AccountingPrismaClient,
  fiscal_years,
} from '@gorazus/core-database';

/** Adaptador sobre `accounting.fiscal_years`. */
export abstract class AnioFiscalRepository extends BaseRepository<
  AccountingPrisma.fiscal_yearsWhereUniqueInput,
  AccountingPrisma.fiscal_yearsWhereInput,
  AccountingPrisma.fiscal_yearsUncheckedCreateInput,
  AccountingPrisma.fiscal_yearsUncheckedUpdateInput,
  fiscal_years,
  AccountingPrismaClient
> {}
