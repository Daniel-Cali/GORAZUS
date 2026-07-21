import { BaseRepository } from '@gorazus/core-database';
import type { CorePrisma, CorePrismaClient, companies } from '@gorazus/core-database';

/** Adaptador sobre `core.companies` (docs/architecture/14-modulo-core.md). */
export abstract class EmpresaRepository extends BaseRepository<
  CorePrisma.companiesWhereUniqueInput,
  CorePrisma.companiesWhereInput,
  CorePrisma.companiesUncheckedCreateInput,
  CorePrisma.companiesUncheckedUpdateInput,
  companies,
  CorePrismaClient
> {}
