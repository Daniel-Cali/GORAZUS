import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CORE, withTenantScope } from '@gorazus/core-database';
import type { CorePrismaClient, system_parameters } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import { ParametroRepository } from './parametro.repository';

@Injectable()
export class ParametroRepositoryPrisma extends ParametroRepository {
  constructor(@Inject(PRISMA_CORE) client: CorePrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.system_parameters.findUnique(args),
      findMany: (args) => tx.system_parameters.findMany(args),
      count: (args) => tx.system_parameters.count(args),
      create: (args) => tx.system_parameters.create(args),
      update: (args) => tx.system_parameters.update(args),
    }));
  }

  async findByKey(
    context: Pick<UserContext, 'tenantId' | 'companyId'>,
    key: string,
  ): Promise<system_parameters | null> {
    return withTenantScope(this.client, context, (tx) =>
      tx.system_parameters.findFirst({ where: { key, deleted_at: null } }),
    );
  }
}
