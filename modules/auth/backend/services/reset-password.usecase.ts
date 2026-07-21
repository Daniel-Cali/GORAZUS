import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import { DomainException } from '@gorazus/core-http';
// eslint-disable-next-line @nx/enforce-module-boundaries -- packages/tooling no tiene project.json propio, ver login.usecase.ts
import { hashPassword } from '../../../../packages/tooling/utils';
import { TenantRepository } from '../repositories/tenant.repository';
import { TokenRepository } from '../repositories/token.repository';
import { UserRepository } from '../repositories/user.repository';
import { SessionRepository } from '../repositories/session.repository';

const PASSWORD_RESET_PURPOSE = 'password_reset';

export class TokenResetInvalidoException extends DomainException {
  constructor() {
    super(
      'TOKEN_RESET_INVALIDO',
      'El token de restablecimiento es inválido, ya fue usado o expiró.',
      400,
    );
  }
}

/**
 * Consume un token de restablecimiento y fija la nueva contraseña
 * (docs/architecture/13-modulo-auth.md §7). Un solo mensaje de error para
 * token inexistente/ya usado/expirado — evita que un atacante distinga
 * entre esos casos probando tokens. Revoca TODAS las sesiones del usuario
 * al finalizar (mismo criterio que un cambio de contraseña en cualquier
 * sistema: una password nueva invalida cualquier sesión abierta con la vieja).
 */
@Injectable()
export class ResetPasswordUseCase {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly tokenRepository: TokenRepository,
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(tenantSlug: string, token: string, newPassword: string): Promise<void> {
    const tenant = await this.tenantRepository.findBySlug(tenantSlug);
    if (!tenant) throw new TokenResetInvalidoException();

    const tokenHash = createHash('sha256').update(token).digest('hex');
    const context: Pick<UserContext, 'tenantId' | 'companyId'> = {
      tenantId: tenant.id,
      companyId: null,
    };
    const registro = await this.tokenRepository.findByHash(
      context,
      tokenHash,
      PASSWORD_RESET_PURPOSE,
    );
    if (!registro || registro.used_at || registro.expires_at < new Date()) {
      throw new TokenResetInvalidoException();
    }

    const fullContext: UserContext = {
      userId: registro.user_id,
      tenantId: tenant.id,
      companyId: null,
      branchId: null,
      sessionId: 'password-reset',
    };

    const passwordHash = await hashPassword(newPassword);
    await this.userRepository.update(
      fullContext,
      { id: registro.user_id },
      { password_hash: passwordHash },
    );
    await this.tokenRepository.update(fullContext, { id: registro.id }, { used_at: new Date() });
    await this.sessionRepository.revokeAllForUser(fullContext, registro.user_id);
  }
}
