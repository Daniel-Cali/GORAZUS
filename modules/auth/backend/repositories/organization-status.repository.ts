import type { UserContext } from '@gorazus/contracts';

/**
 * Puerto — verificación de empresa/sucursal activa (FASE 03 Parte 02,
 * "verificación de empresa/sucursal activa" en refresh/validación de
 * sesión). No extiende `BaseRepository`: solo necesita un booleano por
 * ID, no CRUD genérico — `core.companies`/`core.branches` son propiedad
 * de `modules/configuracion`, `auth` solo lee el flag `is_active` (mismo
 * criterio de "adaptar, no poseer" que `TenantRepository`/`UserRepository`,
 * docs/architecture/13-modulo-auth.md §0).
 */
export abstract class OrganizationStatusRepository {
  abstract isCompanyActive(context: UserContext, companyId: string): Promise<boolean>;
  abstract isBranchActive(context: UserContext, branchId: string): Promise<boolean>;
}
