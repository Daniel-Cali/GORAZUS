import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CORE, withTenantScope } from '@gorazus/core-database';
import type { CorePrisma, CorePrismaClient, audit_logs } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import { AuditoriaRepository } from './auditoria.repository';

@Injectable()
export class AuditoriaRepositoryPrisma extends AuditoriaRepository {
  constructor(@Inject(PRISMA_CORE) private readonly client: CorePrismaClient) {
    super();
  }

  async listar(
    context: UserContext,
    filter: CorePrisma.audit_logsWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<audit_logs>> {
    const { page, pageSize } = pagination;
    return withTenantScope(this.client, context, async (tx) => {
      const where = { ...filter, deleted_at: null };
      const [data, total] = await Promise.all([
        tx.audit_logs.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { occurred_at: 'desc' },
        }),
        tx.audit_logs.count({ where }),
      ]);
      return { data, meta: { page, pageSize, total } };
    });
  }
}
