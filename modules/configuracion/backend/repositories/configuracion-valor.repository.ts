import { BaseRepository } from '@gorazus/core-database';
import type { CorePrisma, CorePrismaClient, system_settings } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

/** Adaptador sobre `core.system_settings` — valor efectivo de un parámetro para un tenant (docs/architecture/14-modulo-core.md). */
export abstract class ConfiguracionValorRepository extends BaseRepository<
  CorePrisma.system_settingsWhereUniqueInput,
  CorePrisma.system_settingsWhereInput,
  CorePrisma.system_settingsUncheckedCreateInput,
  CorePrisma.system_settingsUncheckedUpdateInput,
  system_settings,
  CorePrismaClient
> {
  abstract findByParameterId(
    context: Pick<UserContext, 'tenantId' | 'companyId'>,
    parameterId: string,
  ): Promise<system_settings | null>;
}
