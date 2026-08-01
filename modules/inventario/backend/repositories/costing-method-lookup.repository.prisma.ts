import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_PRODUCTS, withTenantScope } from '@gorazus/core-database';
import type { ProductsPrismaClient } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import { CostingMethodLookupRepository } from './costing-method-lookup.repository';

@Injectable()
export class CostingMethodLookupRepositoryPrisma extends CostingMethodLookupRepository {
  constructor(@Inject(PRISMA_PRODUCTS) private readonly client: ProductsPrismaClient) {
    super();
  }

  async obtenerMetodoDeCosteo(context: UserContext, productId: string): Promise<string | null> {
    const producto = await withTenantScope(this.client, context, (tx) =>
      tx.products.findFirst({
        where: { id: productId, deleted_at: null },
        select: { costing_method: true },
      }),
    );
    return producto?.costing_method ?? null;
  }
}
