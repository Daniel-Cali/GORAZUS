import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_INVENTORY } from '@gorazus/core-database';
import type { InventoryPrismaClient } from '@gorazus/core-database';
import { AlmacenRepository } from './almacen.repository';

@Injectable()
export class AlmacenRepositoryPrisma extends AlmacenRepository {
  constructor(@Inject(PRISMA_INVENTORY) client: InventoryPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.warehouses.findUnique(args),
      findMany: (args) => tx.warehouses.findMany(args),
      count: (args) => tx.warehouses.count(args),
      create: (args) => tx.warehouses.create(args),
      update: (args) => tx.warehouses.update(args),
    }));
  }
}
