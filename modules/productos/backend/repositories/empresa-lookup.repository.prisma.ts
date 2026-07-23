import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CORE, withTenantScope } from '@gorazus/core-database';
import type { CorePrismaClient } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import { EmpresaLookupRepository } from './empresa-lookup.repository';

@Injectable()
export class EmpresaLookupRepositoryPrisma extends EmpresaLookupRepository {
  constructor(@Inject(PRISMA_CORE) private readonly client: CorePrismaClient) {
    super();
  }

  async existeEmpresa(context: UserContext, companyId: string): Promise<boolean> {
    const empresa = await withTenantScope(this.client, context, (tx) =>
      tx.companies.findFirst({ where: { id: companyId, deleted_at: null }, select: { id: true } }),
    );
    return empresa !== null;
  }
}
