import { randomBytes, createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';
import type { AccessTokenPayload } from '@gorazus/contracts';
// Ruta relativa, no el alias `@gorazus/tooling/*` — `packages/tooling` no es
// un paquete pnpm real (sin package.json propio), así que el alias solo
// resuelve para el type-checker (tsconfig paths), no en runtime (ni ts-node
// ni el build de Nx reescriben imports de alias a rutas relativas).
// eslint-disable-next-line @nx/enforce-module-boundaries -- packages/tooling no tiene project.json propio, ver comentario arriba
import { generateUuid, verifyPassword } from '../../../../packages/tooling/utils';
import { DomainException } from '@gorazus/core-http';
import { TenantRepository } from '../repositories/tenant.repository';
import { UserRepository } from '../repositories/user.repository';
import { SessionRepository } from '../repositories/session.repository';
import { Usuario } from '../entities/usuario.entity';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días — docs/architecture/09 §1

export class CredencialesInvalidasException extends DomainException {
  constructor() {
    super('CREDENCIALES_INVALIDAS', 'El usuario o la contraseña son incorrectos.', 401);
  }
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
  user: { id: string; name: string; email: string };
  activeCompanyId: string | null;
  activeBranchId: string | null;
}

/**
 * Flujo de login sin 2FA (docs/architecture/13-modulo-auth.md §2, rama
 * "2FA no requerido" — el resto del diagrama, incluyendo 2FA, es Fase 2).
 * Mismo mensaje de error para tenant inexistente, usuario inexistente y
 * contraseña incorrecta — evita enumeración de tenants/usuarios.
 */
@Injectable()
export class LoginUseCase {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly configService: ConfigService,
  ) {}

  async execute(tenantSlug: string, email: string, password: string): Promise<LoginResult> {
    const tenant = await this.tenantRepository.findBySlug(tenantSlug);
    if (!tenant) {
      throw new CredencialesInvalidasException();
    }

    const record = await this.userRepository.findByEmail(tenant.id, email);
    if (!record) {
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
      throw new CredencialesInvalidasException();
    }

    const passwordValida = await verifyPassword(password, usuario.passwordHash!);
    if (!passwordValida) {
      throw new CredencialesInvalidasException();
    }

    const sessionId = generateUuid();
    const refreshToken = randomBytes(32).toString('hex');
    const refreshTokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    const context = {
      userId: usuario.id,
      tenantId: usuario.tenantId,
      companyId: record.company_id,
      branchId: record.branch_id,
      sessionId,
    };

    await this.sessionRepository.create(context, {
      id: sessionId,
      tenant_id: usuario.tenantId,
      company_id: record.company_id,
      branch_id: record.branch_id,
      user_id: usuario.id,
      refresh_token_hash: refreshTokenHash,
      expires_at: refreshTokenExpiresAt,
    });

    const payload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
      sub: usuario.id,
      tenantId: usuario.tenantId,
      companyId: record.company_id,
      branchId: record.branch_id,
      sessionId,
    };
    const accessToken = jwt.sign(
      payload,
      this.configService.getOrThrow<string>('auth.jwtAccessSecret'),
      {
        expiresIn: ACCESS_TOKEN_TTL,
      },
    );

    return {
      accessToken,
      refreshToken,
      refreshTokenExpiresAt,
      user: { id: usuario.id, name: record.full_name, email: usuario.email },
      activeCompanyId: record.company_id,
      activeBranchId: record.branch_id,
    };
  }
}
