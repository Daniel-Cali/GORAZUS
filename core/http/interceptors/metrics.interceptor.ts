import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { getHttpMetrics } from '@gorazus/core-observability';

/**
 * Alimenta `http_requests_total`/`http_request_duration_ms` (ver
 * core/observability/metrics.ts) con cada request real — sin esto las
 * métricas quedarían declaradas pero vacías. Acceso perezoso a
 * `getHttpMetrics()` (dentro de `intercept`, no del constructor) para
 * no depender del orden exacto de arranque entre `initMetrics()` y la
 * creación del árbol de Nest.
 */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const metrics = getHttpMetrics();
        const labels = {
          method: req.method,
          route: req.route?.path ?? req.originalUrl,
          status: String(res.statusCode),
        };
        metrics.requestsTotal.add(1, labels);
        metrics.requestDurationMs.record(Date.now() - start, labels);
      }),
    );
  }
}
