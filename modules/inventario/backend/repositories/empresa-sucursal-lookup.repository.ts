import type { UserContext } from '@gorazus/contracts';

/**
 * Puerto — verificación de empresa/sucursal al crear un almacén
 * (`inventory.warehouses.company_id`/`branch_id` son `NOT NULL`).
 * `inventario` no es dueño de `core.companies`/`core.branches` — las
 * adapta igual que ya lo hacen `auth`/`seguridad`, cada módulo con su
 * propio repositorio sobre el mismo cliente compartido (nunca
 * importándose entre módulos de negocio, `@nx/enforce-module-boundaries`
 * lo impide estructuralmente).
 */
export abstract class EmpresaSucursalLookupRepository {
  abstract existeEmpresa(context: UserContext, companyId: string): Promise<boolean>;
  /** Además de existir, la sucursal debe pertenecer a la empresa indicada. */
  abstract existeSucursalDeEmpresa(
    context: UserContext,
    branchId: string,
    companyId: string,
  ): Promise<boolean>;
}
