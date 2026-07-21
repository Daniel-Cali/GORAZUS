import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { AccessTokenPayload, UserContext } from '@gorazus/contracts';

/**
 * Verifica la firma/expiración del access token — ver
 * docs/architecture/09-seguridad-y-multiempresa.md §1: JWT de dos
 * tokens, el access token NO lleva roles/permisos embebidos (revocar
 * un permiso debe ser instantáneo, no depender de que expire un token
 * viejo). Esta estrategia solo verifica la firma y traduce el payload
 * a `UserContext` — la resolución de permisos es responsabilidad de
 * `PermissionsGuard`, un paso completamente separado.
 *
 * No valida "sesión revocada" acá (eso requiere consultar Redis, ver
 * §1 del mismo documento: "el estado del refresh token se verifica
 * contra Redis") — el módulo `auth` (Paso 3, todavía no existe) es
 * quien implementa esa verificación en su propio caso de uso de
 * refresh; el access token de corta vida (~15 min) ya acota el riesgo
 * mientras tanto, por diseño.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('auth.jwtAccessSecret'),
    });
  }

  validate(payload: AccessTokenPayload): UserContext {
    return {
      userId: payload.sub,
      tenantId: payload.tenantId,
      companyId: payload.companyId,
      branchId: payload.branchId,
      sessionId: payload.sessionId,
    };
  }
}
