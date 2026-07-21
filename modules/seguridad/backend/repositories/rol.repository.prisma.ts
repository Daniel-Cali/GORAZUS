import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CORE } from '@gorazus/core-database';
import type { CorePrismaClient } from '@gorazus/core-database';
import { RolRepository } from './rol.repository';

@Injectable()
export class RolRepositoryPrisma extends RolRepository {
  constructor(@Inject(PRISMA_CORE) client: CorePrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.roles.findUnique(args),
      findMany: (args) => tx.roles.findMany(args),
      count: (args) => tx.roles.count(args),
      create: (args) => tx.roles.create(args),
      update: (args) => tx.roles.update(args),
    }));
  }
}
