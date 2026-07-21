import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CORE } from '@gorazus/core-database';
import type { CorePrismaClient } from '@gorazus/core-database';
import { UsuarioAdminRepository } from './usuario-admin.repository';

@Injectable()
export class UsuarioAdminRepositoryPrisma extends UsuarioAdminRepository {
  constructor(@Inject(PRISMA_CORE) client: CorePrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.users.findUnique(args),
      findMany: (args) => tx.users.findMany(args),
      count: (args) => tx.users.count(args),
      create: (args) => tx.users.create(args),
      update: (args) => tx.users.update(args),
    }));
  }
}
