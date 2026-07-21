import { randomBytes, createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import { TenantRepository } from '../repositories/tenant.repository';
import { UserRepository } from '../repositories/user.repository';
import { TokenRepository } from '../repositories/token.repository';
import { PasswordResetNotifier } from './password-reset-notifier.port';

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutos — docs/architecture/13-modulo-auth.md §7
const PASSWORD_RESET_PURPOSE = 'password_reset';

/**
 * Genera y entrega un token de restablecimiento (docs/architecture/13-modulo-auth.md §7).
 * Responde éxito genérico siempre — tenant inexistente, email inexistente
 * y email existente son indistinguibles desde afuera (mismo criterio
 * anti-enumeración que `LoginUseCase`); el token real solo se entrega vía
 * `PasswordResetNotifier`, nunca en la respuesta HTTP.
 */
@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly userRepository: UserRepository,
    private readonly tokenRepository: TokenRepository,
    private readonly notifier: PasswordResetNotifier,
  ) {}

  async execute(tenantSlug: string, email: string): Promise<void> {
    const tenant = await this.tenantRepository.findBySlug(tenantSlug);
    if (!tenant) return;

    const usuario = await this.userRepository.findByEmail(tenant.id, email);
    if (!usuario || !usuario.is_active) return;

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    // Sin sesión previa (el usuario todavía no está autenticado) — contexto
    // sintético solo para satisfacer `withTenantScope`, mismo patrón que
    // `LoginUseCase` arma su propio `context` antes de que exista un JWT.
    const context: UserContext = {
      userId: usuario.id,
      tenantId: tenant.id,
      companyId: null,
      branchId: null,
      sessionId: 'password-reset',
    };
    await this.tokenRepository.create(context, {
      tenant_id: tenant.id,
      user_id: usuario.id,
      token_hash: tokenHash,
      purpose: PASSWORD_RESET_PURPOSE,
      expires_at: expiresAt,
    });

    await this.notifier.enviarTokenReset(usuario.email, token, expiresAt);
  }
}
