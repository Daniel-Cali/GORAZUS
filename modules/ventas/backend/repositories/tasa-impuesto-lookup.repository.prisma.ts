import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_TAXES, withTenantScope } from '@gorazus/core-database';
import type { TaxesPrismaClient } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import { TasaImpuestoLookupRepository } from './tasa-impuesto-lookup.repository';

@Injectable()
export class TasaImpuestoLookupRepositoryPrisma extends TasaImpuestoLookupRepository {
  constructor(@Inject(PRISMA_TAXES) private readonly client: TaxesPrismaClient) {
    super();
  }

  async tasaVigente(context: UserContext, taxId: string): Promise<number | null> {
    const hoy = new Date();
    const tasa = await withTenantScope(this.client, context, (tx) =>
      tx.tax_rates.findFirst({
        where: {
          tax_id: taxId,
          deleted_at: null,
          effective_from: { lte: hoy },
          OR: [{ effective_to: null }, { effective_to: { gte: hoy } }],
        },
        orderBy: { effective_from: 'desc' },
      }),
    );
    return tasa ? Number(tasa.rate_percentage) : null;
  }
}
