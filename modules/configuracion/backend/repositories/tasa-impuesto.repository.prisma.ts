import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_TAXES } from '@gorazus/core-database';
import type { TaxesPrismaClient } from '@gorazus/core-database';
import { TasaImpuestoRepository } from './tasa-impuesto.repository';

@Injectable()
export class TasaImpuestoRepositoryPrisma extends TasaImpuestoRepository {
  constructor(@Inject(PRISMA_TAXES) client: TaxesPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.tax_rates.findUnique(args),
      findMany: (args) => tx.tax_rates.findMany(args),
      count: (args) => tx.tax_rates.count(args),
      create: (args) => tx.tax_rates.create(args),
      update: (args) => tx.tax_rates.update(args),
    }));
  }
}
