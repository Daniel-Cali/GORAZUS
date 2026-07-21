import type { tenants } from '@gorazus/core-database';

/**
 * Resolución de tenant por `slug` (subdominio/URL, `core.tenants.slug`,
 * `docs/database/sql/01_core.sql` línea del `COMMENT ON COLUMN`) — paso
 * previo obligatorio al login: `core.users.email` es único **por tenant**
 * (`uq_core_users_tenant_email ON (tenant_id, lower(email))`), nunca
 * global, así que no hay forma de buscar un usuario por email sin saber
 * antes en qué tenant buscar. No extiende `BaseRepository` — es una
 * única lectura sin alcance de tenant (obviamente, es quien lo resuelve)
 * ni paginación, no el CRUD genérico que `BaseRepository` generaliza.
 * `auth` solo lee esta tabla para resolver el login; `configuracion` es
 * quien administra el tenant en sí (alta, datos fiscales, etc.).
 */
export abstract class TenantRepository {
  abstract findBySlug(slug: string): Promise<tenants | null>;
}
