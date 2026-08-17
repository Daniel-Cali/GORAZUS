import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_SUPPLIERS } from '@gorazus/core-database';
import type { SuppliersPrismaClient } from '@gorazus/core-database';
import { ProveedorRepository } from './proveedor.repository';

@Injectable()
export class ProveedorRepositoryPrisma extends ProveedorRepository {
  constructor(@Inject(PRISMA_SUPPLIERS) client: SuppliersPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.suppliers.findUnique(args),
      findMany: (args) => tx.suppliers.findMany(args),
      count: (args) => tx.suppliers.count(args),
      create: (args) => tx.suppliers.create(args),
      update: (args) => tx.suppliers.update(args),
    }));
  }
}
