import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CORE, withTenantScope } from '@gorazus/core-database';
import type { CorePrismaClient, tokens } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import { TokenRepository } from './token.repository';

@Injectable()
export class TokenRepositoryPrisma extends TokenRepository {
  constructor(@Inject(PRISMA_CORE) client: CorePrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.tokens.findUnique(args),
      findMany: (args) => tx.tokens.findMany(args),
      count: (args) => tx.tokens.count(args),
      create: (args) => tx.tokens.create(args),
      update: (args) => tx.tokens.update(args),
    }));
  }

  async findByHash(
    context: Pick<UserContext, 'tenantId' | 'companyId'>,
    tokenHash: string,
    purpose: string,
  ): Promise<tokens | null> {
    return withTenantScope(this.client, context, (tx) =>
      tx.tokens.findFirst({ where: { token_hash: tokenHash, purpose, deleted_at: null } }),
    );
  }
}
