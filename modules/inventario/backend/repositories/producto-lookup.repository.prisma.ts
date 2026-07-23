import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_PRODUCTS, withTenantScope } from '@gorazus/core-database';
import type { ProductsPrismaClient } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import { ProductoLookupRepository } from './producto-lookup.repository';

@Injectable()
export class ProductoLookupRepositoryPrisma extends ProductoLookupRepository {
  constructor(@Inject(PRISMA_PRODUCTS) private readonly client: ProductsPrismaClient) {
    super();
  }

  async existeProducto(context: UserContext, productId: string): Promise<boolean> {
    const producto = await withTenantScope(this.client, context, (tx) =>
      tx.products.findFirst({ where: { id: productId, deleted_at: null }, select: { id: true } }),
    );
    return producto !== null;
  }
}
