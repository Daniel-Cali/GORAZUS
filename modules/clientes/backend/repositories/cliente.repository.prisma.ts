import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CUSTOMERS } from '@gorazus/core-database';
import type { CustomersPrismaClient } from '@gorazus/core-database';
import { ClienteRepository } from './cliente.repository';

@Injectable()
export class ClienteRepositoryPrisma extends ClienteRepository {
  constructor(@Inject(PRISMA_CUSTOMERS) client: CustomersPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.customers.findUnique(args),
      findMany: (args) => tx.customers.findMany(args),
      count: (args) => tx.customers.count(args),
      create: (args) => tx.customers.create(args),
      update: (args) => tx.customers.update(args),
    }));
  }
}
