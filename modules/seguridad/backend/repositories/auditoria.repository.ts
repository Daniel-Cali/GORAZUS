import type { CorePrisma, audit_logs } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

/**
 * Adaptador de solo lectura sobre `core.audit_logs` — NO extiende
 * `BaseRepository`: esa clase asume una fila localizable por `id` solo
 * (`findUnique({ where: { id } })`), pero `audit_logs` está particionada
 * por `occurred_at` (docs/database/sql/29_partitioning.sql) y Postgres
 * exige que la clave de partición forme parte de cualquier unique/PK —
 * el cliente Prisma generado solo ofrece `id_occurred_at` o
 * `local_id_occurred_at` como claves únicas compuestas, nunca `id` a
 * secas. Tampoco tiene `create`/`update`: la fila la escribe un trigger
 * de base de datos, nunca la aplicación (docs/database/05-estrategia-auditoria.md §2).
 */
export abstract class AuditoriaRepository {
  abstract listar(
    context: UserContext,
    filter: CorePrisma.audit_logsWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<audit_logs>>;
}
