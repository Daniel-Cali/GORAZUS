import { BaseRepository } from '@gorazus/core-database';
import type { CorePrisma, CorePrismaClient, tokens } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

/**
 * Adaptador sobre `core.tokens` — tabla de propósito general (verificación
 * de correo, restablecimiento de contraseña, invitaciones,
 * docs/database/sql/01_core.sql). Este módulo solo usa `purpose =
 * 'password_reset'` (docs/architecture/13-modulo-auth.md §7).
 */
export abstract class TokenRepository extends BaseRepository<
  CorePrisma.tokensWhereUniqueInput,
  CorePrisma.tokensWhereInput,
  CorePrisma.tokensUncheckedCreateInput,
  CorePrisma.tokensUncheckedUpdateInput,
  tokens,
  CorePrismaClient
> {
  /**
   * A diferencia de `TenantRepository.findBySlug`/`SessionRepository.findByRefreshTokenHash`
   * (que resuelven ANTES de conocer el tenant), esta búsqueda SÍ requiere
   * `UserContext` con tenant ya resuelto — el flujo de reset de contraseña
   * exige `tenantSlug` en el body precisamente para poder resolver el
   * tenant primero (ver `forgot-password.usecase.ts`), evitando así tener
   * que agregar una excepción de RLS nueva para `core.tokens`.
   */
  abstract findByHash(
    context: Pick<UserContext, 'tenantId' | 'companyId'>,
    tokenHash: string,
    purpose: string,
  ): Promise<tokens | null>;
}
