import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import { DomainException, revokedSessionCacheKey } from '@gorazus/core-http';
import { CacheService } from '@gorazus/core-cache';
import { SessionRepository } from '../repositories/session.repository';

// Igual al TTL del access token — mismo criterio y mismo valor que
// `LogoutUseCase` (`ACCESS_TOKEN_TTL_SECONDS`, ver su comentario): pasado
// eso el JWT ya expiró solo por firma/exp, la marca de revocado en Redis
// sería redundante.
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

export class SesionNoEncontradaException extends DomainException {
  constructor() {
    super('SESION_NO_ENCONTRADA', 'La sesión indicada no existe.', 404);
  }
}

export interface RevokeTokenResult {
  revokedSessions: number;
}

/**
 * `POST /auth/revoke` (FASE 03 Parte 02) — cubre dos pedidos del mismo
 * endpoint: "revocación de tokens" (con `sessionId`, revoca solo esa
 * sesión, con chequeo de pertenencia) y "cierre de sesión en todos los
 * dispositivos" (sin `sessionId`, revoca todas las sesiones activas del
 * usuario). En ambos casos, además de revocar en `core.sessions` (que
 * gatea el refresh), marca cada `sessionId` afectado como revocado en
 * Redis — sin eso, el access token de esa sesión (hasta ~15 min) seguiría
 * siendo válido pese a la revocación, mismo motivo que `LogoutUseCase`.
 */
@Injectable()
export class RevokeTokenUseCase {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly cacheService: CacheService,
  ) {}

  async execute(context: UserContext, sessionId?: string): Promise<RevokeTokenResult> {
    if (sessionId) {
      const session = await this.sessionRepository.findById(context, { id: sessionId });
      // Mismo mensaje para "no existe" y "es de otro usuario" — evita
      // confirmar la existencia de sesiones ajenas (sin enumeración).
      if (!session || session.user_id !== context.userId) {
        throw new SesionNoEncontradaException();
      }
      if (session.revoked_at !== null) {
        return { revokedSessions: 0 };
      }

      await this.sessionRepository.update(context, { id: sessionId }, { revoked_at: new Date() });
      await this.cacheService.set(
        revokedSessionCacheKey(sessionId),
        true,
        ACCESS_TOKEN_TTL_SECONDS,
      );
      return { revokedSessions: 1 };
    }

    const activeSessionIds = await this.sessionRepository.findActiveIdsForUser(
      context,
      context.userId,
    );
    await this.sessionRepository.revokeAllForUser(context, context.userId);
    await Promise.all(
      activeSessionIds.map((id) =>
        this.cacheService.set(revokedSessionCacheKey(id), true, ACCESS_TOKEN_TTL_SECONDS),
      ),
    );
    return { revokedSessions: activeSessionIds.length };
  }
}
