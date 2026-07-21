import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_TAXES } from '@gorazus/core-database';
import type { TaxesPrismaClient } from '@gorazus/core-database';
import { JurisdiccionRepository } from './jurisdiccion.repository';

@Injectable()
export class JurisdiccionRepositoryPrisma extends JurisdiccionRepository {
  constructor(@Inject(PRISMA_TAXES) client: TaxesPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.tax_jurisdictions.findUnique(args),
      findMany: (args) => tx.tax_jurisdictions.findMany(args),
      count: (args) => tx.tax_jurisdictions.count(args),
      create: (args) => tx.tax_jurisdictions.create(args),
      update: (args) => tx.tax_jurisdictions.update(args),
    }));
  }
}
