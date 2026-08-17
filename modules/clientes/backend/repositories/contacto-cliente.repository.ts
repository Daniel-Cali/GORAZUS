import { BaseRepository } from '@gorazus/core-database';
import type {
  CustomersPrisma,
  CustomersPrismaClient,
  customer_contacts,
} from '@gorazus/core-database';

/** Adaptador sobre `customers.customer_contacts`. */
export abstract class ContactoClienteRepository extends BaseRepository<
  CustomersPrisma.customer_contactsWhereUniqueInput,
  CustomersPrisma.customer_contactsWhereInput,
  CustomersPrisma.customer_contactsUncheckedCreateInput,
  CustomersPrisma.customer_contactsUncheckedUpdateInput,
  customer_contacts,
  CustomersPrismaClient
> {}
