import { randomBytes, createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';
import type { AccessTokenPayload } from '@gorazus/contracts';
import { DomainException } from '@gorazus/core-http';
import { SessionRepository } from '../repositories/session.repository';
import { Sesion } from '../entities/sesion.entity';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export class SesionInvalidaException extends DomainException {
  constructor() {
    super('SESION_INVALIDA', 'La sesión expiró o fue cerrada. Iniciá sesión de nuevo.', 401);
  }
}

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

/**
 * Rotación simple (docs/architecture/13-modulo-auth.md §4) — la
 * detección de reuso vía Redis (revocar toda la familia de sesión ante
 * un token ya rotado) queda en Fase 2: acá una sola columna
 * `refresh_token_hash` por sesión ya impide reusar un token rotado
 * (deja de matchear cualquier sesión), solo falta distinguir ese caso
 * de "nunca existió" para registrar el incidente — sin eso todavía.
 */
@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly configService: ConfigService,
  ) {}

  async execute(refreshToken: string): Promise<RefreshResult> {
    const refreshTokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const record = await this.sessionRepository.findByRefreshTokenHash(refreshTokenHash);
    if (!record) {
      throw new SesionInvalidaException();
    }

    const sesion = new Sesion(
      record.id,
      record.user_id,
      record.refresh_token_hash,
      record.expires_at,
      record.revoked_at,
    );
    if (!sesion.estaVigente(new Date())) {
      throw new SesionInvalidaException();
    }

    const nuevoRefreshToken = randomBytes(32).toString('hex');
    const nuevoRefreshTokenHash = createHash('sha256').update(nuevoRefreshToken).digest('hex');
    const nuevoVencimiento = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    const context = {
      userId: record.user_id,
      tenantId: record.tenant_id,
      companyId: record.company_id,
      branchId: record.branch_id,
      sessionId: record.id,
    };
    await this.sessionRepository.update(
      context,
      { id: record.id },
      { refresh_token_hash: nuevoRefreshTokenHash, expires_at: nuevoVencimiento },
    );

    const payload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
      sub: record.user_id,
      tenantId: record.tenant_id,
      companyId: record.company_id,
      branchId: record.branch_id,
      sessionId: record.id,
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
      refreshToken: nuevoRefreshToken,
      refreshTokenExpiresAt: nuevoVencimiento,
    };
  }
}
