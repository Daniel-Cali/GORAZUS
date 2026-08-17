import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CUSTOMERS } from '@gorazus/core-database';
import type { CustomersPrismaClient } from '@gorazus/core-database';
import { DireccionClienteRepository } from './direccion-cliente.repository';

@Injectable()
export class DireccionClienteRepositoryPrisma extends DireccionClienteRepository {
  constructor(@Inject(PRISMA_CUSTOMERS) client: CustomersPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.customer_addresses.findUnique(args),
      findMany: (args) => tx.customer_addresses.findMany(args),
      count: (args) => tx.customer_addresses.count(args),
      create: (args) => tx.customer_addresses.create(args),
      update: (args) => tx.customer_addresses.update(args),
    }));
  }
}
