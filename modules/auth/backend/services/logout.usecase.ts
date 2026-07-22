import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import { CacheService } from '@gorazus/core-cache';
import { revokedSessionCacheKey } from '@gorazus/core-http';
import { SessionRepository } from '../repositories/session.repository';

// Igual al TTL del access token (`ACCESS_TOKEN_TTL`, login.usecase.ts) — pasado
// eso el JWT ya expiró solo por firma/exp, la marca de revocado sería redundante.
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

/**
 * Revoca únicamente la sesión actual — `RevokeAllSessionsUseCase` ("cerrar
 * sesión en todos los dispositivos", docs/architecture/13-modulo-auth.md §9)
 * queda en Fase 2. Además de revocar `core.sessions` (que gatea el refresh
 * token), marca el `sessionId` como revocado en Redis
 * (`JwtStrategy.validate`, `core/http`) — sin esto, el access token ya
 * emitido seguía siendo válido hasta su expiración natural (~15 min) aunque
 * el usuario hubiera hecho logout.
 */
@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly cacheService: CacheService,
  ) {}

  async execute(context: UserContext): Promise<void> {
    await this.sessionRepository.update(
      context,
      { id: context.sessionId },
      { revoked_at: new Date() },
    );
    await this.cacheService.set(
      revokedSessionCacheKey(context.sessionId),
      true,
      ACCESS_TOKEN_TTL_SECONDS,
    );
  }
}
