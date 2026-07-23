import { BaseRepository } from '@gorazus/core-database';
import type {
  ProductsPrisma,
  ProductsPrismaClient,
  product_categories,
} from '@gorazus/core-database';

/** Adaptador sobre `products.product_categories` (docs/architecture/18-modulo-products.md §2). */
export abstract class CategoriaProductoRepository extends BaseRepository<
  ProductsPrisma.product_categoriesWhereUniqueInput,
  ProductsPrisma.product_categoriesWhereInput,
  ProductsPrisma.product_categoriesUncheckedCreateInput,
  ProductsPrisma.product_categoriesUncheckedUpdateInput,
  product_categories,
  ProductsPrismaClient
> {}
