import { BaseRepository } from '@gorazus/core-database';
import type {
  AccountingPrisma,
  AccountingPrismaClient,
  cost_centers,
} from '@gorazus/core-database';

/** Adaptador sobre `accounting.cost_centers`. */
export abstract class CentroCostoRepository extends BaseRepository<
  AccountingPrisma.cost_centersWhereUniqueInput,
  AccountingPrisma.cost_centersWhereInput,
  AccountingPrisma.cost_centersUncheckedCreateInput,
  AccountingPrisma.cost_centersUncheckedUpdateInput,
  cost_centers,
  AccountingPrismaClient
> {}
