import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_PRODUCTS, withTenantScope } from '@gorazus/core-database';
import type { ProductsPrismaClient } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import { ProductoLookupRepository, type ControlProducto } from './producto-lookup.repository';

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

  async obtenerControl(context: UserContext, productId: string): Promise<ControlProducto | null> {
    const producto = await withTenantScope(this.client, context, (tx) =>
      tx.products.findFirst({
        where: { id: productId, deleted_at: null },
        select: { tracks_lot: true, tracks_serial: true },
      }),
    );
    if (!producto) return null;
    return { tracksLot: producto.tracks_lot, tracksSerial: producto.tracks_serial };
  }

  async listarPorCategoria(context: UserContext, categoryId: string): Promise<string[]> {
    const productos = await withTenantScope(this.client, context, (tx) =>
      tx.products.findMany({
        where: { category_id: categoryId, deleted_at: null },
        select: { id: true },
      }),
    );
    return productos.map((p) => p.id);
  }
}
