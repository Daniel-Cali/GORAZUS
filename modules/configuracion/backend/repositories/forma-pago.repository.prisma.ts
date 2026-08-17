import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CONFIGURATION } from '@gorazus/core-database';
import type { ConfigurationPrismaClient } from '@gorazus/core-database';
import { FormaPagoRepository } from './forma-pago.repository';

@Injectable()
export class FormaPagoRepositoryPrisma extends FormaPagoRepository {
  constructor(@Inject(PRISMA_CONFIGURATION) client: ConfigurationPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.payment_forms.findUnique(args),
      findMany: (args) => tx.payment_forms.findMany(args),
      count: (args) => tx.payment_forms.count(args),
      create: (args) => tx.payment_forms.create(args),
      update: (args) => tx.payment_forms.update(args),
    }));
  }
}
