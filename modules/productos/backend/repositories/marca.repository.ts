import { BaseRepository } from '@gorazus/core-database';
import type { ProductsPrisma, ProductsPrismaClient, brands } from '@gorazus/core-database';

/** Adaptador sobre `products.brands` (docs/architecture/18-modulo-products.md §3). */
export abstract class MarcaRepository extends BaseRepository<
  ProductsPrisma.brandsWhereUniqueInput,
  ProductsPrisma.brandsWhereInput,
  ProductsPrisma.brandsUncheckedCreateInput,
  ProductsPrisma.brandsUncheckedUpdateInput,
  brands,
  ProductsPrismaClient
> {}
