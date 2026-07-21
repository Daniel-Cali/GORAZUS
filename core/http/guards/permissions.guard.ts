import { CanActivate, ExecutionContext, Inject, Injectable, Optional } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserContext } from '@gorazus/contracts';
import { REQUIRE_PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { PERMISSIONS_RESOLVER, PermissionsResolver } from './permissions-resolver.interface';

/**
 * Autorización RBAC — corre después de `JwtAuthGuard` (que ya pobló
 * `request.user`). Solo actúa sobre endpoints con `@RequirePermission(...)`;
 * uno sin ese decorador pasa (la autenticación por sí sola ya lo cubrió).
 *
 * Sin implementación real de `PermissionsResolver` todavía (módulo
 * `seguridad` es Paso 3) — `NoopPermissionsResolver` deniega todo por
 * defecto: es el default seguro ("fail closed"), nunca "permitir todo
 * hasta que exista el módulo real" ("fail open"), que sería un hueco de
 * seguridad silencioso el día que alguien agregue `@RequirePermission`
 * a un endpoint real antes de que `seguridad` esté conectado.
 */
@Injectable()
export class NoopPermissionsResolver implements PermissionsResolver {
  async hasPermission(): Promise<boolean> {
    return false;
  }
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Optional()
    @Inject(PERMISSIONS_RESOLVER)
    private readonly resolver: PermissionsResolver = new NoopPermissionsResolver(),
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.getAllAndOverride<string | undefined>(
      REQUIRE_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!permission) {
      return true;
    }
    const request = context.switchToHttp().getRequest<{ user: UserContext }>();
    return this.resolver.hasPermission(request.user, permission);
  }
}
