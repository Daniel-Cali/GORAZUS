import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_INVENTORY } from '@gorazus/core-database';
import type { InventoryPrismaClient } from '@gorazus/core-database';
import { ZonaAlmacenRepository } from './zona-almacen.repository';

@Injectable()
export class ZonaAlmacenRepositoryPrisma extends ZonaAlmacenRepository {
  constructor(@Inject(PRISMA_INVENTORY) client: InventoryPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.warehouse_zones.findUnique(args),
      findMany: (args) => tx.warehouse_zones.findMany(args),
      count: (args) => tx.warehouse_zones.count(args),
      create: (args) => tx.warehouse_zones.create(args),
      update: (args) => tx.warehouse_zones.update(args),
    }));
  }
}
