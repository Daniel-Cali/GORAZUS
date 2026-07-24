import type { UserContext } from '@gorazus/contracts';

/** Puerto — verificación de empresa/sucursal al crear una caja. Mismo patrón que `modules/inventario/backend/repositories/empresa-sucursal-lookup.repository.ts`. */
export abstract class EmpresaSucursalLookupRepository {
  abstract existeEmpresa(context: UserContext, companyId: string): Promise<boolean>;
  abstract existeSucursalDeEmpresa(
    context: UserContext,
    branchId: string,
    companyId: string,
  ): Promise<boolean>;
}
