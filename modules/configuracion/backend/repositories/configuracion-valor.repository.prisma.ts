import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CORE, withTenantScope } from '@gorazus/core-database';
import type { CorePrismaClient, system_settings } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import { ConfiguracionValorRepository } from './configuracion-valor.repository';

@Injectable()
export class ConfiguracionValorRepositoryPrisma extends ConfiguracionValorRepository {
  constructor(@Inject(PRISMA_CORE) client: CorePrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.system_settings.findUnique(args),
      findMany: (args) => tx.system_settings.findMany(args),
      count: (args) => tx.system_settings.count(args),
      create: (args) => tx.system_settings.create(args),
      update: (args) => tx.system_settings.update(args),
    }));
  }

  async findByParameterId(
    context: Pick<UserContext, 'tenantId' | 'companyId'>,
    parameterId: string,
  ): Promise<system_settings | null> {
    return withTenantScope(this.client, context, (tx) =>
      tx.system_settings.findFirst({ where: { parameter_id: parameterId, deleted_at: null } }),
    );
  }
}
