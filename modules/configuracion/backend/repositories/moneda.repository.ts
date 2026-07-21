import { BaseRepository } from '@gorazus/core-database';
import type {
  ConfigurationPrisma,
  ConfigurationPrismaClient,
  currencies,
} from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

/** Adaptador sobre `configuration.currencies` — cliente Prisma independiente de `core` (docs/architecture/14-modulo-core.md). */
export abstract class MonedaRepository extends BaseRepository<
  ConfigurationPrisma.currenciesWhereUniqueInput,
  ConfigurationPrisma.currenciesWhereInput,
  ConfigurationPrisma.currenciesUncheckedCreateInput,
  ConfigurationPrisma.currenciesUncheckedUpdateInput,
  currencies,
  ConfigurationPrismaClient
> {
  abstract findByIsoCode(
    context: Pick<UserContext, 'tenantId' | 'companyId'>,
    isoCode: string,
  ): Promise<currencies | null>;
}
