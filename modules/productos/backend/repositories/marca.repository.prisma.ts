import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_PRODUCTS } from '@gorazus/core-database';
import type { ProductsPrismaClient } from '@gorazus/core-database';
import { MarcaRepository } from './marca.repository';

@Injectable()
export class MarcaRepositoryPrisma extends MarcaRepository {
  constructor(@Inject(PRISMA_PRODUCTS) client: ProductsPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.brands.findUnique(args),
      findMany: (args) => tx.brands.findMany(args),
      count: (args) => tx.brands.count(args),
      create: (args) => tx.brands.create(args),
      update: (args) => tx.brands.update(args),
    }));
  }
}
