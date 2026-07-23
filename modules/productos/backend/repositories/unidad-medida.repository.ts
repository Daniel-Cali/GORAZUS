import { BaseRepository } from '@gorazus/core-database';
import type {
  ProductsPrisma,
  ProductsPrismaClient,
  units_of_measure,
} from '@gorazus/core-database';

/** Adaptador sobre `products.units_of_measure` (docs/architecture/18-modulo-products.md §1). */
export abstract class UnidadMedidaRepository extends BaseRepository<
  ProductsPrisma.units_of_measureWhereUniqueInput,
  ProductsPrisma.units_of_measureWhereInput,
  ProductsPrisma.units_of_measureUncheckedCreateInput,
  ProductsPrisma.units_of_measureUncheckedUpdateInput,
  units_of_measure,
  ProductsPrismaClient
> {}
