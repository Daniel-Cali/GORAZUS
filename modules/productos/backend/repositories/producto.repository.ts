import { BaseRepository } from '@gorazus/core-database';
import type { ProductsPrisma, ProductsPrismaClient, products } from '@gorazus/core-database';

/** Adaptador sobre `products.products` (docs/architecture/18-modulo-products.md §1). */
export abstract class ProductoRepository extends BaseRepository<
  ProductsPrisma.productsWhereUniqueInput,
  ProductsPrisma.productsWhereInput,
  ProductsPrisma.productsUncheckedCreateInput,
  ProductsPrisma.productsUncheckedUpdateInput,
  products,
  ProductsPrismaClient
> {}
