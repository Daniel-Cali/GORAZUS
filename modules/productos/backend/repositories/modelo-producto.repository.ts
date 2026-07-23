import { BaseRepository } from '@gorazus/core-database';
import type { ProductsPrisma, ProductsPrismaClient, product_models } from '@gorazus/core-database';

/** Adaptador sobre `products.product_models` (docs/architecture/18-modulo-products.md §4). */
export abstract class ModeloProductoRepository extends BaseRepository<
  ProductsPrisma.product_modelsWhereUniqueInput,
  ProductsPrisma.product_modelsWhereInput,
  ProductsPrisma.product_modelsUncheckedCreateInput,
  ProductsPrisma.product_modelsUncheckedUpdateInput,
  product_models,
  ProductsPrismaClient
> {}
