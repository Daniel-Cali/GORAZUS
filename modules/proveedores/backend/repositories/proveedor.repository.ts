import { BaseRepository } from '@gorazus/core-database';
import type { SuppliersPrisma, SuppliersPrismaClient, suppliers } from '@gorazus/core-database';

/** Adaptador sobre `suppliers.suppliers` (`docs/database/logico/04-suppliers.md`). */
export abstract class ProveedorRepository extends BaseRepository<
  SuppliersPrisma.suppliersWhereUniqueInput,
  SuppliersPrisma.suppliersWhereInput,
  SuppliersPrisma.suppliersUncheckedCreateInput,
  SuppliersPrisma.suppliersUncheckedUpdateInput,
  suppliers,
  SuppliersPrismaClient
> {}
