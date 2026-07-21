import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CORE, withTenantScope } from '@gorazus/core-database';
import type { CorePrismaClient, permissions } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import { PermisoRepository } from './permiso.repository';

@Injectable()
export class PermisoRepositoryPrisma extends PermisoRepository {
  constructor(@Inject(PRISMA_CORE) client: CorePrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.permissions.findUnique(args),
      findMany: (args) => tx.permissions.findMany(args),
      count: (args) => tx.permissions.count(args),
      create: (args) => tx.permissions.create(args),
      update: (args) => tx.permissions.update(args),
    }));
  }

  async findByCode(
    context: Pick<UserContext, 'tenantId' | 'companyId'>,
    code: string,
  ): Promise<permissions | null> {
    return withTenantScope(this.client, context, (tx) =>
      tx.permissions.findFirst({ where: { code, deleted_at: null } }),
    );
  }
}
