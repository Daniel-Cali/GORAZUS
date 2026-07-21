import { MiddlewareConsumer, Module, NestModule, Global } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { GlobalExceptionFilter } from './filters/exception.filter';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { SerializationInterceptor } from './interceptors/serialization.interceptor';
import { MetricsInterceptor } from './interceptors/metrics.interceptor';
import { TenantInterceptor } from './interceptors/tenant.interceptor';
import { CorrelationIdMiddleware } from './middlewares/correlation-id.middleware';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

/**
 * Filtros/interceptores/pipes/guards globales — ver
 * docs/architecture/12-backend-enterprise.md §2 (tabla core/*).
 * @Global(): mismo criterio que ConfigModule/LoggingModule.
 *
 * Rate limit: 100 requests / 60s por defecto, global — valor de
 * referencia razonable para arrancar; ningún doc fijaba un número
 * todavía. Se ajusta por endpoint con @Throttle() cuando un módulo lo
 * necesite (ver @nestjs/throttler).
 *
 * Orden de guards (throttle → autenticación → autorización) e
 * interceptors (Tenant primero, envuelve a los demás — ver el propio
 * `TenantInterceptor` para el porqué de ese orden específico) es
 * intencional, no alfabético.
 */
@Global()
@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  providers: [
    JwtStrategy,
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: TenantInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: SerializationInterceptor },
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
  exports: [PassportModule],
})
export class HttpModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
