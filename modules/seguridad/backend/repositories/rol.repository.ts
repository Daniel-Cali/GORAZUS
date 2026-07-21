import { BaseRepository } from '@gorazus/core-database';
import type { CorePrisma, CorePrismaClient, roles } from '@gorazus/core-database';

/** Adaptador sobre `core.roles` (docs/architecture/15-modulo-security.md §2). */
export abstract class RolRepository extends BaseRepository<
  CorePrisma.rolesWhereUniqueInput,
  CorePrisma.rolesWhereInput,
  CorePrisma.rolesUncheckedCreateInput,
  CorePrisma.rolesUncheckedUpdateInput,
  roles,
  CorePrismaClient
> {}
