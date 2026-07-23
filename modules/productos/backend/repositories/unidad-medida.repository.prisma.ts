import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_PRODUCTS } from '@gorazus/core-database';
import type { ProductsPrismaClient } from '@gorazus/core-database';
import { UnidadMedidaRepository } from './unidad-medida.repository';

@Injectable()
export class UnidadMedidaRepositoryPrisma extends UnidadMedidaRepository {
  constructor(@Inject(PRISMA_PRODUCTS) client: ProductsPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.units_of_measure.findUnique(args),
      findMany: (args) => tx.units_of_measure.findMany(args),
      count: (args) => tx.units_of_measure.count(args),
      create: (args) => tx.units_of_measure.create(args),
      update: (args) => tx.units_of_measure.update(args),
    }));
  }
}
