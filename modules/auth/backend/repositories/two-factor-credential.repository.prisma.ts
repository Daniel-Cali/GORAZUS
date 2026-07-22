import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_SECURITY, withTenantScope } from '@gorazus/core-database';
import type { SecurityPrismaClient } from '@gorazus/core-database';
import {
  TwoFactorCredential,
  TwoFactorCredentialRepository,
} from './two-factor-credential.repository';

@Injectable()
export class TwoFactorCredentialRepositoryPrisma extends TwoFactorCredentialRepository {
  constructor(@Inject(PRISMA_SECURITY) private readonly client: SecurityPrismaClient) {
    super();
  }

  async findConfirmedByUserId(
    tenantId: string,
    userId: string,
  ): Promise<TwoFactorCredential | null> {
    const record = await withTenantScope(this.client, { tenantId, companyId: null }, (tx) =>
      tx.two_factor_credentials.findFirst({
        where: { user_id: userId, deleted_at: null, confirmed_at: { not: null } },
      }),
    );
    return record ? { encryptedSecret: record.encrypted_secret } : null;
  }
}
