import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CORE } from '@gorazus/core-database';
import type { CorePrismaClient } from '@gorazus/core-database';
import { EmpresaRepository } from './empresa.repository';

@Injectable()
export class EmpresaRepositoryPrisma extends EmpresaRepository {
  constructor(@Inject(PRISMA_CORE) client: CorePrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.companies.findUnique(args),
      findMany: (args) => tx.companies.findMany(args),
      count: (args) => tx.companies.count(args),
      create: (args) => tx.companies.create(args),
      update: (args) => tx.companies.update(args),
    }));
  }
}
