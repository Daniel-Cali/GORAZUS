import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_SECURITY, withTenantScope } from '@gorazus/core-database';
import type { SecurityPrismaClient } from '@gorazus/core-database';
import { LoginAttemptRecord, LoginAttemptRepository } from './login-attempt.repository';

@Injectable()
export class LoginAttemptRepositoryPrisma extends LoginAttemptRepository {
  constructor(@Inject(PRISMA_SECURITY) private readonly client: SecurityPrismaClient) {
    super();
  }

  async countRecentFailures(
    tenantId: string,
    emailAttempted: string,
    since: Date,
  ): Promise<number> {
    return withTenantScope(this.client, { tenantId, companyId: null }, (tx) =>
      tx.login_attempts.count({
        where: {
          tenant_id: tenantId,
          email_attempted: emailAttempted,
          succeeded: false,
          created_at: { gte: since },
        },
      }),
    );
  }

  async record(attempt: LoginAttemptRecord): Promise<void> {
    await withTenantScope(this.client, { tenantId: attempt.tenantId, companyId: null }, (tx) =>
      tx.login_attempts.create({
        data: {
          tenant_id: attempt.tenantId,
          email_attempted: attempt.emailAttempted,
          user_id: attempt.userId,
          ip_address: attempt.ipAddress,
          succeeded: attempt.succeeded,
        },
      }),
    );
  }
}
