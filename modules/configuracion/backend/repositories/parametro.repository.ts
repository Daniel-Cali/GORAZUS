import { BaseRepository } from '@gorazus/core-database';
import type { CorePrisma, CorePrismaClient, system_parameters } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

/** Adaptador sobre `core.system_parameters` (docs/architecture/14-modulo-core.md). */
export abstract class ParametroRepository extends BaseRepository<
  CorePrisma.system_parametersWhereUniqueInput,
  CorePrisma.system_parametersWhereInput,
  CorePrisma.system_parametersUncheckedCreateInput,
  CorePrisma.system_parametersUncheckedUpdateInput,
  system_parameters,
  CorePrismaClient
> {
  abstract findByKey(
    context: Pick<UserContext, 'tenantId' | 'companyId'>,
    key: string,
  ): Promise<system_parameters | null>;
}
