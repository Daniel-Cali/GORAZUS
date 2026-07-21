import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { RequestContext } from '@gorazus/core-logging';

/**
 * Primer middleware de la cadena — genera/propaga el `requestId` que
 * Logging (§2) y Tracing (§7, más adelante) reutilizan como trace ID,
 * ver docs/architecture/32-core-platform/07-observabilidad-y-gobernanza.md.
 * Reusa `x-request-id` si el cliente/proxy ya lo mandó (permite
 * correlacionar desde el borde), genera uno nuevo si no.
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    res.setHeader('x-request-id', requestId);

    RequestContext.run({ requestId }, () => next());
  }
}
