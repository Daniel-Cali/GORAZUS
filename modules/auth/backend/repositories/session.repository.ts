import { BaseRepository } from '@gorazus/core-database';
import type { CorePrisma, CorePrismaClient, sessions } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

/** Adaptador sobre `core.sessions` (docs/architecture/13-modulo-auth.md §0, §9). */
export abstract class SessionRepository extends BaseRepository<
  CorePrisma.sessionsWhereUniqueInput,
  CorePrisma.sessionsWhereInput,
  CorePrisma.sessionsUncheckedCreateInput,
  CorePrisma.sessionsUncheckedUpdateInput,
  sessions,
  CorePrismaClient
> {
  /**
   * Búsqueda por hash de refresh token — `RefreshTokenUseCase`
   * (docs/architecture/13-modulo-auth.md §4). Sin `tenantId` a propósito:
   * el refresh, igual que el login, corre ANTES de tener contexto de
   * tenant (la cookie de refresh no lleva tenant embebido, es opaca). El
   * hash es aleatorio de 256 bits — colisión entre tenants distintos es
   * criptográficamente despreciable, así que resolver el tenant A PARTIR
   * del resultado (no antes) es seguro. Requiere la misma excepción RLS
   * puntual que `core.tenants` (ver `tenant_lookup_by_slug`), aplicada acá
   * como `session_lookup_by_refresh_hash`.
   */
  abstract findByRefreshTokenHash(refreshTokenHash: string): Promise<sessions | null>;
  /** Revoca TODA la familia de sesiones de un usuario — detección de reuso (§4) y "cerrar sesión en todos los dispositivos" (§9). */
  abstract revokeAllForUser(context: UserContext, userId: string): Promise<void>;
  /** IDs de sesiones activas (no revocadas, no expiradas) de un usuario — `RevokeTokenUseCase` los necesita ANTES de revocar en bloque, para invalidar también el access token vigente de cada una en Redis (§9, FASE 03 Parte 02). */
  abstract findActiveIdsForUser(context: UserContext, userId: string): Promise<string[]>;
}
