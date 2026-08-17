import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CUSTOMERS, withTenantScope } from '@gorazus/core-database';
import type { CustomersPrismaClient } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import { ClienteLookupRepository } from './cliente-lookup.repository';

@Injectable()
export class ClienteLookupRepositoryPrisma extends ClienteLookupRepository {
  constructor(@Inject(PRISMA_CUSTOMERS) private readonly client: CustomersPrismaClient) {
    super();
  }

  async existeCliente(context: UserContext, customerId: string): Promise<boolean> {
    const cliente = await withTenantScope(this.client, context, (tx) =>
      tx.customers.findFirst({ where: { id: customerId, deleted_at: null }, select: { id: true } }),
    );
    return cliente !== null;
  }
}
