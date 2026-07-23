import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_PRODUCTS } from '@gorazus/core-database';
import type { ProductsPrismaClient } from '@gorazus/core-database';
import { ModeloProductoRepository } from './modelo-producto.repository';

@Injectable()
export class ModeloProductoRepositoryPrisma extends ModeloProductoRepository {
  constructor(@Inject(PRISMA_PRODUCTS) client: ProductsPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.product_models.findUnique(args),
      findMany: (args) => tx.product_models.findMany(args),
      count: (args) => tx.product_models.count(args),
      create: (args) => tx.product_models.create(args),
      update: (args) => tx.product_models.update(args),
    }));
  }
}
