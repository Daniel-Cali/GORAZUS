import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RequestContext } from '@gorazus/core-logging';
import type { UserContext } from '@gorazus/contracts';

/**
 * Resuelve el `UserContext` completo (ver docs/architecture/12-backend-enterprise.md §3,
 * "Resolución de empresa activa" → `core/http/interceptors/tenant.interceptor.ts`)
 * a partir de `request.user`, ya poblado por `JwtAuthGuard`/`JwtStrategy`
 * — este interceptor corre DESPUÉS de los guards (orden fijo de Nest:
 * middlewares → guards → interceptors → pipes → handler), así que
 * `request.user` ya existe acá salvo en rutas `@Public()` (sin JWT,
 * sin `UserContext` — `RequestContext` sigue funcionando para
 * correlación básica vía `CorrelationIdMiddleware`, solo sin
 * tenantId/companyId).
 *
 * Nota técnica no obvia: envolver `next.handle()` con
 * `RequestContext.run()` SIN suscribirse dentro del callback no
 * propaga el contexto a la ejecución asíncrona real (AsyncLocalStorage
 * solo mantiene contexto durante la llamada síncrona) — por eso acá se
 * envuelve el propio `subscribe`, no el `Observable` en sí, dentro de
 * `RequestContext.run()`.
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ user?: UserContext; requestId?: string }>();
    const user = request.user;

    return new Observable((subscriber) => {
      const previous = RequestContext.get();
      const data = {
        requestId: previous?.requestId ?? 'unknown',
        tenantId: user?.tenantId,
        userId: user?.userId,
      };
      RequestContext.run(data, () => {
        const subscription = next.handle().subscribe(subscriber);
        return () => subscription.unsubscribe();
      });
    });
  }
}
