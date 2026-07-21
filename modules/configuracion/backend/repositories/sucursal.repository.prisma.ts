import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CORE } from '@gorazus/core-database';
import type { CorePrismaClient } from '@gorazus/core-database';
import { SucursalRepository } from './sucursal.repository';

@Injectable()
export class SucursalRepositoryPrisma extends SucursalRepository {
  constructor(@Inject(PRISMA_CORE) client: CorePrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.branches.findUnique(args),
      findMany: (args) => tx.branches.findMany(args),
      count: (args) => tx.branches.count(args),
      create: (args) => tx.branches.create(args),
      update: (args) => tx.branches.update(args),
    }));
  }
}
