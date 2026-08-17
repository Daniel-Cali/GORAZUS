import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CUSTOMERS } from '@gorazus/core-database';
import type { CustomersPrismaClient } from '@gorazus/core-database';
import { ContactoClienteRepository } from './contacto-cliente.repository';

@Injectable()
export class ContactoClienteRepositoryPrisma extends ContactoClienteRepository {
  constructor(@Inject(PRISMA_CUSTOMERS) client: CustomersPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.customer_contacts.findUnique(args),
      findMany: (args) => tx.customer_contacts.findMany(args),
      count: (args) => tx.customer_contacts.count(args),
      create: (args) => tx.customer_contacts.create(args),
      update: (args) => tx.customer_contacts.update(args),
    }));
  }
}
