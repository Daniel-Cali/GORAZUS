import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CORE, withTenantScope } from '@gorazus/core-database';
import type { CorePrismaClient, sessions } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import { SessionRepository } from './session.repository';

@Injectable()
export class SessionRepositoryPrisma extends SessionRepository {
  constructor(@Inject(PRISMA_CORE) client: CorePrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.sessions.findUnique(args),
      findMany: (args) => tx.sessions.findMany(args),
      count: (args) => tx.sessions.count(args),
      create: (args) => tx.sessions.create(args),
      update: (args) => tx.sessions.update(args),
    }));
  }

  /** Sin `withTenantScope` — la política `session_lookup_by_refresh_hash` (docs/database/sql/30_backup_restore.sql) permite este SELECT puntual sin `app.current_tenant_id` seteado, igual justificación que `tenant_lookup_by_slug`. */
  async findByRefreshTokenHash(refreshTokenHash: string): Promise<sessions | null> {
    return this.client.sessions.findFirst({
      where: { refresh_token_hash: refreshTokenHash, deleted_at: null },
    });
  }

  async revokeAllForUser(context: UserContext, userId: string): Promise<void> {
    await withTenantScope(this.client, context, (tx) =>
      tx.sessions.updateMany({
        where: { user_id: userId, revoked_at: null },
        data: { revoked_at: new Date() },
      }),
    );
  }
}
