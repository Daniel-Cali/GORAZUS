import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_PRODUCTS } from '@gorazus/core-database';
import type { ProductsPrismaClient } from '@gorazus/core-database';
import { CategoriaProductoRepository } from './categoria-producto.repository';

@Injectable()
export class CategoriaProductoRepositoryPrisma extends CategoriaProductoRepository {
  constructor(@Inject(PRISMA_PRODUCTS) client: ProductsPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.product_categories.findUnique(args),
      findMany: (args) => tx.product_categories.findMany(args),
      count: (args) => tx.product_categories.count(args),
      create: (args) => tx.product_categories.create(args),
      update: (args) => tx.product_categories.update(args),
    }));
  }
}
