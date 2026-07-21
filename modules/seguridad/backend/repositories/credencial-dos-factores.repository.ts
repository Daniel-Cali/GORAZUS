import { BaseRepository } from '@gorazus/core-database';
import type {
  SecurityPrisma,
  SecurityPrismaClient,
  two_factor_credentials,
} from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

/** Adaptador sobre `security.two_factor_credentials` (docs/architecture/15-modulo-security.md). */
export abstract class CredencialDosFactoresRepository extends BaseRepository<
  SecurityPrisma.two_factor_credentialsWhereUniqueInput,
  SecurityPrisma.two_factor_credentialsWhereInput,
  SecurityPrisma.two_factor_credentialsUncheckedCreateInput,
  SecurityPrisma.two_factor_credentialsUncheckedUpdateInput,
  two_factor_credentials,
  SecurityPrismaClient
> {
  abstract findByUserId(
    context: Pick<UserContext, 'tenantId' | 'companyId'>,
    userId: string,
  ): Promise<two_factor_credentials | null>;
}
