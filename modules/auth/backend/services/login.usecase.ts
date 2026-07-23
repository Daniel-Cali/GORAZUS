import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// eslint-disable-next-line @nx/enforce-module-boundaries -- packages/tooling no tiene project.json propio, ver comentario abajo
import { generateUuid, verifyPassword } from '../../../../packages/tooling/utils';
import { DomainException } from '@gorazus/core-http';
import { CacheService } from '@gorazus/core-cache';
import { TenantRepository } from '../repositories/tenant.repository';
import { UserRepository } from '../repositories/user.repository';
import { LoginAttemptRepository } from '../repositories/login-attempt.repository';
import { TwoFactorCredentialRepository } from '../repositories/two-factor-credential.repository';
import { Usuario } from '../entities/usuario.entity';
import { IssueLoginSessionService, LoginResult } from './issue-login-session.service';
import { twoFactorChallengeCacheKey, TwoFactorChallenge } from './two-factor-challenge';

// Umbral/ventana de bloqueo (`security.login_attempts`) y TTL del desafío
// 2FA ahora vienen de `auth.config.ts` (`LOGIN_LOCKOUT_THRESHOLD`/
// `LOGIN_LOCKOUT_WINDOW_MINUTES`/`TWO_FACTOR_CHALLENGE_TTL_MINUTES`,
// FASE 03 Parte 02) — antes hardcodeados acá, mismo valor por default.
// Auto-expira: no hay "desbloqueo" explícito, simplemente deja de haber
// >=umbral fallos en la ventana configurada.
// Trade-off conocido y aceptado: como el bloqueo cuenta por (tenant, email)
// sin importar si el usuario existe, un atacante puede forzar el bloqueo de
// la cuenta de una víctima real fallando el umbral de veces a propósito
// (self-DoS) — mitigarlo del todo requeriría CAPTCHA o límite también por
// IP, fuera de alcance de esta fase.

export class CredencialesInvalidasException extends DomainException {
  constructor() {
    super('CREDENCIALES_INVALIDAS', 'El usuario o la contraseña son incorrectos.', 401);
  }
}

export class CuentaBloqueadaException extends DomainException {
  constructor() {
    super('CUENTA_BLOQUEADA', 'Demasiados intentos fallidos. Probá de nuevo en unos minutos.', 429);
  }
}

export type LoginOutcome =
  | { requiresTwoFactor: false; result: LoginResult }
  | { requiresTwoFactor: true; challengeToken: string };

/**
 * Flujo de login — docs/architecture/13-modulo-auth.md §2. Mismo mensaje de
 * error para tenant inexistente, usuario inexistente y contraseña
 * incorrecta — evita enumeración de tenants/usuarios.
 *
 * 2FA (esta sesión): si el usuario tiene una credencial TOTP confirmada
 * (`security.two_factor_credentials`, ver `modules/seguridad/backend/
 * services/dos-factores.service.ts`), NO emite tokens todavía — genera un
 * `challengeToken` opaco (Redis, TTL corto) y el cliente completa el login
 * en `CompleteTwoFactorLoginUseCase` (`POST /auth/login/2fa`) con el código
 * TOTP real. Antes de esta sesión, `LoginUseCase` ignoraba 2FA por
 * completo — un usuario con 2FA configurado igual entraba solo con
 * contraseña.
 */
@Injectable()
export class LoginUseCase {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly userRepository: UserRepository,
    private readonly loginAttemptRepository: LoginAttemptRepository,
    private readonly twoFactorCredentialRepository: TwoFactorCredentialRepository,
    private readonly issueLoginSessionService: IssueLoginSessionService,
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    tenantSlug: string,
    email: string,
    password: string,
    ipAddress: string | null = null,
    userAgent: string | null = null,
    rememberMe = false,
  ): Promise<LoginOutcome> {
    const tenant = await this.tenantRepository.findBySlug(tenantSlug);
    if (!tenant) {
      throw new CredencialesInvalidasException();
    }

    const lockoutThreshold = this.configService.getOrThrow<number>('auth.loginLockoutThreshold');
    const lockoutWindowMinutes = this.configService.getOrThrow<number>(
      'auth.loginLockoutWindowMinutes',
    );
    const since = new Date(Date.now() - lockoutWindowMinutes * 60 * 1000);
    const recentFailures = await this.loginAttemptRepository.countRecentFailures(
      tenant.id,
      email,
      since,
    );
    if (recentFailures >= lockoutThreshold) {
      throw new CuentaBloqueadaException();
    }

    const record = await this.userRepository.findByEmail(tenant.id, email);
    if (!record) {
      await this.registrarIntento(tenant.id, email, null, ipAddress, false);
      throw new CredencialesInvalidasException();
    }

    const usuario = new Usuario(
      record.id,
      record.tenant_id,
      record.email,
      record.password_hash,
      record.full_name,
      record.is_active,
    );
    if (!usuario.puedeAutenticarse()) {
      await this.registrarIntento(tenant.id, email, record.id, ipAddress, false);
      throw new CredencialesInvalidasException();
    }

    const passwordValida = await verifyPassword(password, usuario.passwordHash!);
    if (!passwordValida) {
      await this.registrarIntento(tenant.id, email, record.id, ipAddress, false);
      throw new CredencialesInvalidasException();
    }

    await this.registrarIntento(tenant.id, email, usuario.id, ipAddress, true);

    const credencialDosFactores = await this.twoFactorCredentialRepository.findConfirmedByUserId(
      tenant.id,
      usuario.id,
    );
    if (credencialDosFactores) {
      const challengeToken = generateUuid();
      const challenge: TwoFactorChallenge = {
        userId: usuario.id,
        tenantId: tenant.id,
        email,
        ipAddress,
        userAgent,
        rememberMe,
      };
      const challengeTtlMinutes = this.configService.getOrThrow<number>(
        'auth.twoFactorChallengeTtlMinutes',
      );
      await this.cacheService.set(
        twoFactorChallengeCacheKey(challengeToken),
        challenge,
        challengeTtlMinutes * 60,
      );
      return { requiresTwoFactor: true, challengeToken };
    }

    const result = await this.issueLoginSessionService.issue(record, {
      ipAddress,
      userAgent,
      rememberMe,
    });
    return { requiresTwoFactor: false, result };
  }

  private async registrarIntento(
    tenantId: string,
    email: string,
    userId: string | null,
    ipAddress: string | null,
    succeeded: boolean,
  ): Promise<void> {
    await this.loginAttemptRepository.record({
      tenantId,
      emailAttempted: email,
      userId,
      ipAddress,
      succeeded,
    });
  }
}
