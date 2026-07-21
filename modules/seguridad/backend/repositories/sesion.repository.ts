import { BaseRepository } from '@gorazus/core-database';
import type { CorePrisma, CorePrismaClient, sessions } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

/**
 * Adaptador administrativo sobre `core.sessions` — listar/revocar desde
 * una vista de Seguridad (docs/architecture/15-modulo-security.md).
 * Deliberadamente separado del `SessionRepository` de `modules/auth/backend`
 * (ese resuelve sesiones durante el flujo de login/refresh; este las
 * gestiona después) — cada módulo de negocio adapta su propio schema,
 * nunca se importan repositorios de otro módulo de negocio directamente
 * (docs/architecture/01-estructura-monorepo.md §3).
 */
export abstract class SesionRepository extends BaseRepository<
  CorePrisma.sessionsWhereUniqueInput,
  CorePrisma.sessionsWhereInput,
  CorePrisma.sessionsUncheckedCreateInput,
  CorePrisma.sessionsUncheckedUpdateInput,
  sessions,
  CorePrismaClient
> {
  /**
   * `findMany` heredado no ordena — un usuario puede acumular cientos de
   * sesiones a lo largo del tiempo, y sin `ORDER BY` Postgres no garantiza
   * devolver las más recientes primero dentro de la página. Las sesiones
   * más nuevas son las que le importan a un administrador.
   */
  abstract listarPorUsuario(
    context: UserContext,
    userId: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<sessions>>;
}
