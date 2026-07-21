import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CORE, withTenantScope } from '@gorazus/core-database';
import type { CorePrismaClient, sessions } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import { SesionRepository } from './sesion.repository';

@Injectable()
export class SesionRepositoryPrisma extends SesionRepository {
  constructor(@Inject(PRISMA_CORE) private readonly prismaClient: CorePrismaClient) {
    super(prismaClient, (tx) => ({
      findUnique: (args) => tx.sessions.findUnique(args),
      findMany: (args) => tx.sessions.findMany(args),
      count: (args) => tx.sessions.count(args),
      create: (args) => tx.sessions.create(args),
      update: (args) => tx.sessions.update(args),
    }));
  }

  async listarPorUsuario(
    context: UserContext,
    userId: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<sessions>> {
    const { page, pageSize } = pagination;
    return withTenantScope(this.prismaClient, context, async (tx) => {
      const where = { user_id: userId, deleted_at: null };
      const [data, total] = await Promise.all([
        tx.sessions.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { created_at: 'desc' },
        }),
        tx.sessions.count({ where }),
      ]);
      return { data, meta: { page, pageSize, total } };
    });
  }
}
