import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_PRODUCTS } from '@gorazus/core-database';
import type { ProductsPrismaClient } from '@gorazus/core-database';
import { ProductoRepository } from './producto.repository';

@Injectable()
export class ProductoRepositoryPrisma extends ProductoRepository {
  constructor(@Inject(PRISMA_PRODUCTS) client: ProductsPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.products.findUnique(args),
      findMany: (args) => tx.products.findMany(args),
      count: (args) => tx.products.count(args),
      create: (args) => tx.products.create(args),
      update: (args) => tx.products.update(args),
    }));
  }
}
