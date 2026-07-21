import { BaseRepository } from '@gorazus/core-database';
import type { CorePrisma, CorePrismaClient, branches } from '@gorazus/core-database';

/** Adaptador sobre `core.branches` (docs/architecture/14-modulo-core.md). */
export abstract class SucursalRepository extends BaseRepository<
  CorePrisma.branchesWhereUniqueInput,
  CorePrisma.branchesWhereInput,
  CorePrisma.branchesUncheckedCreateInput,
  CorePrisma.branchesUncheckedUpdateInput,
  branches,
  CorePrismaClient
> {}
