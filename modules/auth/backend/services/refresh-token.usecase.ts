import { randomBytes, createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AccessTokenPayload } from '@gorazus/contracts';
import { DomainException } from '@gorazus/core-http';
import { LoggerService } from '@gorazus/core-logging';
import { SessionRepository } from '../repositories/session.repository';
import { OrganizationStatusRepository } from '../repositories/organization-status.repository';
import { Sesion } from '../entities/sesion.entity';
import { signAccessToken } from './jwt-token.provider';
import {
  EmpresaInactivaException,
  SucursalInactivaException,
} from './organization-status.exceptions';

export class SesionInvalidaException extends DomainException {
  constructor() {
    super('SESION_INVALIDA', 'La sesión expiró o fue cerrada. Iniciá sesión de nuevo.', 401);
  }
}

/** Solo se lanza con `AUTH_STRICT_SESSION_VALIDATION=true` — ver comentario de `execute()`. */
export class SesionSospechosaException extends DomainException {
  constructor() {
    super(
      'SESION_SOSPECHOSA',
      'El refresh se rechazó por un cambio de IP/dispositivo no reconocido. Iniciá sesión de nuevo.',
      401,
    );
  }
}

export { EmpresaInactivaException, SucursalInactivaException };

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

/**
 * Rotación (docs/architecture/13-modulo-auth.md §4) — la detección de
 * reuso vía Redis (revocar toda la familia de sesión ante un token ya
 * rotado reutilizado) sigue pendiente (`TECHNICAL_DEBT.md §1`): acá una
 * sola columna `refresh_token_hash` por sesión ya impide reusar un token
 * rotado (deja de matchear cualquier sesión), solo falta distinguir ese
 * caso de "nunca existió" para registrar el incidente.
 *
 * FASE 03 Parte 02 agregó: TTLs desde config (antes hardcodeados),
 * verificación de empresa/sucursal activa, protección de session-hijacking
 * (IP/User-Agent) y preservación de "recordar sesión" a través de la
 * rotación.
 */
@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly organizationStatusRepository: OrganizationStatusRepository,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  async execute(
    refreshToken: string,
    ipAddress: string | null = null,
    userAgent: string | null = null,
  ): Promise<RefreshResult> {
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

    const context = {
      userId: record.user_id,
      tenantId: record.tenant_id,
      companyId: record.company_id,
      branchId: record.branch_id,
      sessionId: record.id,
    };

    // Protección de session-hijacking (docs/architecture/13-modulo-auth.md
    // §9): compara contra la IP/User-Agent guardados al emitir/rotar la
    // sesión por última vez. Siempre se registra un warning ante un
    // mismatch (visibilidad, sin fricción por default — IP/UA cambian
    // legítimamente: red móvil, actualización de navegador). Solo rechaza
    // si `AUTH_STRICT_SESSION_VALIDATION=true` (decisión de producto, no
    // técnica — ver env.schema.ts).
    const ipMismatch =
      record.ip_address !== null && ipAddress !== null && record.ip_address !== ipAddress;
    const userAgentMismatch =
      record.user_agent !== null && userAgent !== null && record.user_agent !== userAgent;
    if (ipMismatch || userAgentMismatch) {
      this.logger.warn('Refresh con IP/User-Agent distinto al de la sesión original', {
        sessionId: record.id,
        userId: record.user_id,
        ipEsperada: record.ip_address,
        ipRecibida: ipAddress,
        userAgentEsperado: record.user_agent,
        userAgentRecibido: userAgent,
      });
      if (this.configService.getOrThrow<boolean>('auth.strictSessionValidation')) {
        throw new SesionSospechosaException();
      }
    }

    // Verificación de empresa/sucursal activa — una sesión emitida con una
    // empresa/sucursal que se desactivó después no debe poder seguir
    // refrescándose. `null` significa "sin empresa/sucursal seleccionada
    // todavía" (no aplica la verificación).
    if (record.company_id !== null) {
      const companyActive = await this.organizationStatusRepository.isCompanyActive(
        context,
        record.company_id,
      );
      if (!companyActive) {
        throw new EmpresaInactivaException();
      }
    }
    if (record.branch_id !== null) {
      const branchActive = await this.organizationStatusRepository.isBranchActive(
        context,
        record.branch_id,
      );
      if (!branchActive) {
        throw new SucursalInactivaException();
      }
    }

    const nuevoRefreshToken = randomBytes(32).toString('hex');
    const nuevoRefreshTokenHash = createHash('sha256').update(nuevoRefreshToken).digest('hex');
    const nuevoVencimiento = new Date(Date.now() + this.resolveRefreshTtlMs(record));

    await this.sessionRepository.update(
      context,
      { id: record.id },
      {
        refresh_token_hash: nuevoRefreshTokenHash,
        expires_at: nuevoVencimiento,
        ip_address: ipAddress ?? record.ip_address,
        user_agent: userAgent ?? record.user_agent,
      },
    );

    const payload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
      sub: record.user_id,
      tenantId: record.tenant_id,
      companyId: record.company_id,
      branchId: record.branch_id,
      sessionId: record.id,
    };
    const accessToken = signAccessToken(
      payload,
      this.configService.getOrThrow<string>('auth.jwtAccessSecret'),
      this.configService.getOrThrow<string>('auth.accessTokenTtl'),
    );

    return {
      accessToken,
      refreshToken: nuevoRefreshToken,
      refreshTokenExpiresAt: nuevoVencimiento,
    };
  }

  /**
   * "Recordar sesión" no tiene columna propia en `core.sessions` — se
   * infiere comparando la duración original de la sesión
   * (`expires_at - created_at`) contra el TTL estándar: si es
   * sensiblemente mayor, la sesión se emitió con `rememberMe: true` y la
   * rotación preserva ese TTL largo en vez de volver al corto. Margen de
   * 1.5x para no confundir con drift de reloj/latencia normal.
   */
  private resolveRefreshTtlMs(record: { expires_at: Date; created_at: Date }): number {
    const standardTtlMs =
      this.configService.getOrThrow<number>('auth.refreshTokenTtlDays') * 24 * 60 * 60 * 1000;
    const rememberMeTtlMs =
      this.configService.getOrThrow<number>('auth.rememberMeTtlDays') * 24 * 60 * 60 * 1000;
    const originalDurationMs = record.expires_at.getTime() - record.created_at.getTime();
    const wasRememberMe = originalDurationMs > standardTtlMs * 1.5;
    return wasRememberMe ? rememberMeTtlMs : standardTtlMs;
  }
}
