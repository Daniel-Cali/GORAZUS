import { randomBytes, createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AccessTokenPayload } from '@gorazus/contracts';
// eslint-disable-next-line @nx/enforce-module-boundaries -- packages/tooling no tiene project.json propio, ver login.usecase.ts
import { generateUuid } from '../../../../packages/tooling/utils';
import { SessionRepository } from '../repositories/session.repository';
import { signAccessToken } from './jwt-token.provider';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
  user: { id: string; name: string; email: string };
  activeCompanyId: string | null;
  activeBranchId: string | null;
}

export interface AuthenticatedUserRecord {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  company_id: string | null;
  branch_id: string | null;
}

export interface IssueLoginSessionOptions {
  ipAddress?: string | null;
  userAgent?: string | null;
  /** "Recordar sesión" (FASE 03 Parte 02) — usa `auth.rememberMeTtlDays` en vez de `auth.refreshTokenTtlDays`. */
  rememberMe?: boolean;
}

/**
 * Extraído de `LoginUseCase` — crea la sesión (`core.sessions`) y firma el
 * access token para un usuario YA autenticado (contraseña, y 2FA si
 * aplica). Compartido por `LoginUseCase` (login sin 2FA) y
 * `CompleteTwoFactorLoginUseCase` (segundo paso del login con 2FA) para no
 * duplicar la emisión de tokens en dos lugares.
 */
@Injectable()
export class IssueLoginSessionService {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly configService: ConfigService,
  ) {}

  async issue(
    record: AuthenticatedUserRecord,
    options: IssueLoginSessionOptions = {},
  ): Promise<LoginResult> {
    const sessionId = generateUuid();
    const refreshToken = randomBytes(32).toString('hex');
    const refreshTokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const refreshTokenTtlDays = options.rememberMe
      ? this.configService.getOrThrow<number>('auth.rememberMeTtlDays')
      : this.configService.getOrThrow<number>('auth.refreshTokenTtlDays');
    const refreshTokenExpiresAt = new Date(Date.now() + refreshTokenTtlDays * 24 * 60 * 60 * 1000);

    const context = {
      userId: record.id,
      tenantId: record.tenant_id,
      companyId: record.company_id,
      branchId: record.branch_id,
      sessionId,
    };

    await this.sessionRepository.create(context, {
      id: sessionId,
      tenant_id: record.tenant_id,
      company_id: record.company_id,
      branch_id: record.branch_id,
      user_id: record.id,
      refresh_token_hash: refreshTokenHash,
      expires_at: refreshTokenExpiresAt,
      ip_address: options.ipAddress ?? null,
      user_agent: options.userAgent ?? null,
    });

    const payload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
      sub: record.id,
      tenantId: record.tenant_id,
      companyId: record.company_id,
      branchId: record.branch_id,
      sessionId,
    };
    const accessToken = signAccessToken(
      payload,
      this.configService.getOrThrow<string>('auth.jwtAccessSecret'),
      this.configService.getOrThrow<string>('auth.accessTokenTtl'),
    );

    return {
      accessToken,
      refreshToken,
      refreshTokenExpiresAt,
      user: { id: record.id, name: record.full_name, email: record.email },
      activeCompanyId: record.company_id,
      activeBranchId: record.branch_id,
    };
  }
}
