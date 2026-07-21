import { BaseRepository } from '@gorazus/core-database';
import type { CorePrisma, CorePrismaClient, permissions } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

/**
 * Adaptador sobre `core.permissions` — catálogo de solo lectura desde la
 * UI (docs/architecture/15-modulo-security.md §3: un permiso se agrega al
 * crear el módulo que lo necesita, nunca en runtime). `create`/`update`
 * (heredados de `BaseRepository`) solo los usa el script de seed. Sembrado
 * bajo el tenant sentinela (`00000000-0000-0000-0000-000000000000`) — la
 * política RLS genérica ya deja visibles esas filas a cualquier tenant real
 * (docs/database/sql/30_backup_restore.sql, "El sentinela de tenant global
 * permite ver catálogos compartidos"), así que `findByCode` no necesita
 * ninguna excepción de RLS: se resuelve dentro de una request ya
 * autenticada, con `UserContext` completo.
 */
export abstract class PermisoRepository extends BaseRepository<
  CorePrisma.permissionsWhereUniqueInput,
  CorePrisma.permissionsWhereInput,
  CorePrisma.permissionsUncheckedCreateInput,
  CorePrisma.permissionsUncheckedUpdateInput,
  permissions,
  CorePrismaClient
> {
  abstract findByCode(
    context: Pick<UserContext, 'tenantId' | 'companyId'>,
    code: string,
  ): Promise<permissions | null>;
}
