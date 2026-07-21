import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CONFIGURATION, withTenantScope } from '@gorazus/core-database';
import type { ConfigurationPrismaClient, currencies } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import { MonedaRepository } from './moneda.repository';

@Injectable()
export class MonedaRepositoryPrisma extends MonedaRepository {
  constructor(@Inject(PRISMA_CONFIGURATION) client: ConfigurationPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.currencies.findUnique(args),
      findMany: (args) => tx.currencies.findMany(args),
      count: (args) => tx.currencies.count(args),
      create: (args) => tx.currencies.create(args),
      update: (args) => tx.currencies.update(args),
    }));
  }

  async findByIsoCode(
    context: Pick<UserContext, 'tenantId' | 'companyId'>,
    isoCode: string,
  ): Promise<currencies | null> {
    return withTenantScope(this.client, context, (tx) =>
      tx.currencies.findFirst({ where: { iso_code: isoCode, deleted_at: null } }),
    );
  }
}
