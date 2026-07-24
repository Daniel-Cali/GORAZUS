import { BaseRepository } from '@gorazus/core-database';
import type { CustomersPrisma, CustomersPrismaClient, customers } from '@gorazus/core-database';

/** Adaptador sobre `customers.customers` (ver `POS_ARCHITECTURE.md §3` para el alcance real). */
export abstract class ClienteRepository extends BaseRepository<
  CustomersPrisma.customersWhereUniqueInput,
  CustomersPrisma.customersWhereInput,
  CustomersPrisma.customersUncheckedCreateInput,
  CustomersPrisma.customersUncheckedUpdateInput,
  customers,
  CustomersPrismaClient
> {}
