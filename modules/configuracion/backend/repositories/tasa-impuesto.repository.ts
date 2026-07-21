import { BaseRepository } from '@gorazus/core-database';
import type { TaxesPrisma, TaxesPrismaClient, tax_rates } from '@gorazus/core-database';

/** Adaptador sobre `taxes.tax_rates` (docs/architecture/14-modulo-core.md). */
export abstract class TasaImpuestoRepository extends BaseRepository<
  TaxesPrisma.tax_ratesWhereUniqueInput,
  TaxesPrisma.tax_ratesWhereInput,
  TaxesPrisma.tax_ratesUncheckedCreateInput,
  TaxesPrisma.tax_ratesUncheckedUpdateInput,
  tax_rates,
  TaxesPrismaClient
> {}
