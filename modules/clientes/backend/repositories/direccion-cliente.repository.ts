import { BaseRepository } from '@gorazus/core-database';
import type {
  CustomersPrisma,
  CustomersPrismaClient,
  customer_addresses,
} from '@gorazus/core-database';

/** Adaptador sobre `customers.customer_addresses`. */
export abstract class DireccionClienteRepository extends BaseRepository<
  CustomersPrisma.customer_addressesWhereUniqueInput,
  CustomersPrisma.customer_addressesWhereInput,
  CustomersPrisma.customer_addressesUncheckedCreateInput,
  CustomersPrisma.customer_addressesUncheckedUpdateInput,
  customer_addresses,
  CustomersPrismaClient
> {}
