import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_PRODUCTS, withTenantScope } from '@gorazus/core-database';
import type { ProductsPrismaClient } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import { ProductoLookupRepository, type ProductoBuscado } from './producto-lookup.repository';

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

  async buscar(context: UserContext, query: string, limit: number): Promise<ProductoBuscado[]> {
    const productos = await withTenantScope(this.client, context, (tx) =>
      tx.products.findMany({
        where: { sku: { contains: query, mode: 'insensitive' }, deleted_at: null },
        take: limit,
        orderBy: { sku: 'asc' },
      }),
    );
    return productos.map((p) => ({
      id: p.id,
      sku: p.sku,
      listPrice: p.list_price ? Number(p.list_price) : null,
      baseUnitId: p.base_unit_id,
    }));
  }

  async obtenerPorSku(context: UserContext, sku: string): Promise<ProductoBuscado | null> {
    const producto = await withTenantScope(this.client, context, (tx) =>
      tx.products.findFirst({ where: { sku, deleted_at: null } }),
    );
    if (!producto) return null;
    return {
      id: producto.id,
      sku: producto.sku,
      listPrice: producto.list_price ? Number(producto.list_price) : null,
      baseUnitId: producto.base_unit_id,
    };
  }
}
