import type { UserContext } from '@gorazus/contracts';

/**
 * Puerto — verificación de empresa antes de crear cualquier proveedor
 * (`company_id` es `NOT NULL` en `suppliers.suppliers`). `proveedores`
 * no es dueño de `core.companies` — la adapta igual que ya lo hacen
 * `auth`/`seguridad`/`inventario`/`productos`, cada módulo con su propio
 * repositorio sobre el mismo cliente compartido (nunca importándose
 * entre módulos de negocio, `@nx/enforce-module-boundaries` lo impide
 * estructuralmente).
 */
export abstract class EmpresaLookupRepository {
  abstract existeEmpresa(context: UserContext, companyId: string): Promise<boolean>;
}
