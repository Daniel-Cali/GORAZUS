import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { AccessTokenPayload, UserContext } from '@gorazus/contracts';
import { CacheService } from '@gorazus/core-cache';
import { revokedSessionCacheKey } from '../revoked-session-cache-key';

/**
 * Verifica la firma/expiración del access token — ver
 * docs/architecture/09-seguridad-y-multiempresa.md §1: JWT de dos
 * tokens, el access token NO lleva roles/permisos embebidos (revocar
 * un permiso debe ser instantáneo, no depender de que expire un token
 * viejo). Esta estrategia solo verifica la firma y traduce el payload
 * a `UserContext` — la resolución de permisos es responsabilidad de
 * `PermissionsGuard`, un paso completamente separado.
 *
 * Revocación: en vez de una blacklist de JWTs crudos, se marca el
 * `sessionId` (ya embebido en el payload, ya trackeado en
 * `core.sessions`) como revocado en Redis al hacer logout
 * (`LogoutUseCase`, `modules/auth/backend`) — acá solo se consulta esa
 * marca. Evita depender de `core/http` (type:core) sobre un módulo de
 * negocio: la escritura vive en `auth`, esta estrategia solo lee la
 * misma clave vía `revokedSessionCacheKey()` (contrato compartido).
 * TTL corto en Redis (igual al TTL del access token, 15 min) — pasado
 * eso el JWT ya expiró solo, la marca sería redundante.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly cacheService: CacheService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('auth.jwtAccessSecret'),
    });
  }

  async validate(payload: AccessTokenPayload): Promise<UserContext> {
    const revoked = await this.cacheService.get<boolean>(revokedSessionCacheKey(payload.sessionId));
    if (revoked) {
      throw new UnauthorizedException('La sesión fue cerrada.');
    }

    return {
      userId: payload.sub,
      tenantId: payload.tenantId,
      companyId: payload.companyId,
      branchId: payload.branchId,
      sessionId: payload.sessionId,
    };
  }
}
