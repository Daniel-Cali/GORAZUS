import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_INVENTORY } from '@gorazus/core-database';
import type { InventoryPrismaClient } from '@gorazus/core-database';
import { UbicacionAlmacenRepository } from './ubicacion-almacen.repository';

@Injectable()
export class UbicacionAlmacenRepositoryPrisma extends UbicacionAlmacenRepository {
  constructor(@Inject(PRISMA_INVENTORY) client: InventoryPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.warehouse_locations.findUnique(args),
      findMany: (args) => tx.warehouse_locations.findMany(args),
      count: (args) => tx.warehouse_locations.count(args),
      create: (args) => tx.warehouse_locations.create(args),
      update: (args) => tx.warehouse_locations.update(args),
    }));
  }
}
