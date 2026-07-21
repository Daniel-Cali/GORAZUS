import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_TAXES, withTenantScope } from '@gorazus/core-database';
import type { TaxesPrismaClient, taxes } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import { ImpuestoRepository } from './impuesto.repository';

@Injectable()
export class ImpuestoRepositoryPrisma extends ImpuestoRepository {
  constructor(@Inject(PRISMA_TAXES) client: TaxesPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.taxes.findUnique(args),
      findMany: (args) => tx.taxes.findMany(args),
      count: (args) => tx.taxes.count(args),
      create: (args) => tx.taxes.create(args),
      update: (args) => tx.taxes.update(args),
    }));
  }

  async findByCode(
    context: Pick<UserContext, 'tenantId' | 'companyId'>,
    code: string,
  ): Promise<taxes | null> {
    return withTenantScope(this.client, context, (tx) =>
      tx.taxes.findFirst({ where: { code, deleted_at: null } }),
    );
  }
}
