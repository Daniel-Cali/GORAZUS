import type { UserContext } from '@gorazus/contracts';

/**
 * Puerto sobre las dos tablas de unión N:M del RBAC (`core.role_permissions`,
 * `core.user_roles`, docs/architecture/13-modulo-auth.md §6) — no extiende
 * `BaseRepository` porque no es el CRUD de una sola entidad, es la
 * resolución de la relación entre tres tablas (`resolverPermisosDeUsuario`
 * es exactamente lo que `PermissionsResolverService` necesita).
 */
export abstract class AsignacionRepository {
  abstract asignarPermisoARol(
    context: UserContext,
    rolId: string,
    permisoId: string,
  ): Promise<void>;
  abstract revocarPermisoDeRol(
    context: UserContext,
    rolId: string,
    permisoId: string,
  ): Promise<void>;
  abstract asignarRolAUsuario(context: UserContext, userId: string, rolId: string): Promise<void>;
  abstract revocarRolDeUsuario(context: UserContext, userId: string, rolId: string): Promise<void>;
  /** Códigos de permiso efectivos de un usuario (unión de todos sus roles) — solo RBAC, sin ACL/ABAC (Fase 2, docs/architecture/15-modulo-security.md §4,6). */
  abstract resolverPermisosDeUsuario(
    context: Pick<UserContext, 'tenantId' | 'companyId'>,
    userId: string,
  ): Promise<string[]>;
  /** Códigos de permiso asignados directamente a un rol (no resuelve por usuario). */
  abstract listarPermisosDeRol(context: UserContext, rolId: string): Promise<string[]>;
}
