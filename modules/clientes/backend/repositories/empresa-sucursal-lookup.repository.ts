import type { UserContext } from '@gorazus/contracts';

/**
 * Puerto — verificación de empresa/sucursal al crear un cliente. Mismo
 * patrón que `modules/inventario/backend/repositories/empresa-sucursal-lookup.repository.ts`
 * (cada módulo de negocio adapta `core.companies`/`core.branches` con su
 * propio repositorio, nunca importándose entre módulos —
 * `@nx/enforce-module-boundaries`).
 */
export abstract class EmpresaSucursalLookupRepository {
  abstract existeEmpresa(context: UserContext, companyId: string): Promise<boolean>;
  abstract existeSucursalDeEmpresa(
    context: UserContext,
    branchId: string,
    companyId: string,
  ): Promise<boolean>;
}
