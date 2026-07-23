import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CORE, withTenantScope } from '@gorazus/core-database';
import type { CorePrismaClient } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import { OrganizationStatusRepository } from './organization-status.repository';

@Injectable()
export class OrganizationStatusRepositoryPrisma extends OrganizationStatusRepository {
  constructor(@Inject(PRISMA_CORE) private readonly client: CorePrismaClient) {
    super();
  }

  async isCompanyActive(context: UserContext, companyId: string): Promise<boolean> {
    const company = await withTenantScope(this.client, context, (tx) =>
      tx.companies.findFirst({
        where: { id: companyId, deleted_at: null },
        select: { is_active: true },
      }),
    );
    return company?.is_active ?? false;
  }

  async isBranchActive(context: UserContext, branchId: string): Promise<boolean> {
    const branch = await withTenantScope(this.client, context, (tx) =>
      tx.branches.findFirst({
        where: { id: branchId, deleted_at: null },
        select: { is_active: true },
      }),
    );
    return branch?.is_active ?? false;
  }
}
