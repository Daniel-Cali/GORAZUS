import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CORE, withTenantScope } from '@gorazus/core-database';
import type { CorePrismaClient, users } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import { UserRepository } from './user.repository';

@Injectable()
export class UserRepositoryPrisma extends UserRepository {
  constructor(@Inject(PRISMA_CORE) client: CorePrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.users.findUnique(args),
      findMany: (args) => tx.users.findMany(args),
      count: (args) => tx.users.count(args),
      create: (args) => tx.users.create(args),
      update: (args) => tx.users.update(args),
    }));
  }

  async findByEmail(tenantId: string, email: string): Promise<users | null> {
    return withTenantScope(this.client, { tenantId, companyId: null }, (tx) =>
      tx.users.findFirst({ where: { tenant_id: tenantId, email, deleted_at: null } }),
    );
  }

  async marcarUltimoLogin(context: UserContext, userId: string, fecha: Date): Promise<void> {
    await withTenantScope(this.client, context, (tx) =>
      tx.users.update({ where: { id: userId }, data: { last_login_at: fecha } }),
    );
  }
}
