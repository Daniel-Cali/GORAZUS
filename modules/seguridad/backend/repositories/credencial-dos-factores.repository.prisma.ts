import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_SECURITY, withTenantScope } from '@gorazus/core-database';
import type { SecurityPrismaClient, two_factor_credentials } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import { CredencialDosFactoresRepository } from './credencial-dos-factores.repository';

@Injectable()
export class CredencialDosFactoresRepositoryPrisma extends CredencialDosFactoresRepository {
  constructor(@Inject(PRISMA_SECURITY) client: SecurityPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.two_factor_credentials.findUnique(args),
      findMany: (args) => tx.two_factor_credentials.findMany(args),
      count: (args) => tx.two_factor_credentials.count(args),
      create: (args) => tx.two_factor_credentials.create(args),
      update: (args) => tx.two_factor_credentials.update(args),
    }));
  }

  async findByUserId(
    context: Pick<UserContext, 'tenantId' | 'companyId'>,
    userId: string,
  ): Promise<two_factor_credentials | null> {
    return withTenantScope(this.client, context, (tx) =>
      tx.two_factor_credentials.findFirst({ where: { user_id: userId, deleted_at: null } }),
    );
  }
}
