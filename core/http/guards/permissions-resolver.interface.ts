import type { UserContext } from '@gorazus/contracts';

/**
 * Puerto que `PermissionsGuard` consume para resolver si un usuario
 * tiene un permiso — la implementación real (consulta a `seguridad`
 * con cache en Redis, docs/architecture/09-seguridad-y-multiempresa.md §2)
 * la provee el módulo `seguridad` cuando exista (Paso 3). Mientras
 * tanto, `NoopPermissionsResolver` (mismo archivo que el guard) permite
 * que la plataforma arranque y compile sin ese módulo, denegando todo
 * permiso explícitamente en vez de fallar el boot — ver el guard para
 * el porqué de "denegar", no "permitir todo", como default seguro.
 */
export const PERMISSIONS_RESOLVER = Symbol('PERMISSIONS_RESOLVER');

export interface PermissionsResolver {
  hasPermission(user: UserContext, permission: string): Promise<boolean>;
}
