import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import { SessionRepository } from '../repositories/session.repository';

/** Revoca únicamente la sesión actual — `RevokeAllSessionsUseCase` ("cerrar sesión en todos los dispositivos", docs/architecture/13-modulo-auth.md §9) queda en Fase 2. */
@Injectable()
export class LogoutUseCase {
  constructor(private readonly sessionRepository: SessionRepository) {}

  async execute(context: UserContext): Promise<void> {
    await this.sessionRepository.update(
      context,
      { id: context.sessionId },
      { revoked_at: new Date() },
    );
  }
}
