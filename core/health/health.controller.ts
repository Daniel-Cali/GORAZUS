import { Controller, Get, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '@gorazus/core-http';
import { HealthService } from './health.service';

/**
 * `/health/live`: el proceso está arriba, sin verificar dependencias
 * (Kubernetes lo usa para decidir si reiniciar el pod).
 * `/health/ready`: agrega los indicadores registrados (Postgres,
 * Redis, RabbitMQ...); si falla, K8s deja de enrutar tráfico a esta
 * réplica sin reiniciarla, dándole tiempo a recuperarse — ver
 * docs/architecture/32-core-platform/07-observabilidad-y-gobernanza.md.
 *
 * `@Public()`: bug real encontrado en FASE 05 — el `JwtAuthGuard` global
 * (`core/http/http.module.ts`, `APP_GUARD`) cubría estas rutas por defecto,
 * devolviendo 401 (confirmado corriendo la imagen de producción real). El
 * kubelet que hace el liveness/readiness probe no tiene ni puede tener un
 * JWT — sin `@Public()` un pod nunca pasaría el probe y Kubernetes lo
 * reiniciaría en bucle.
 */
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get('live')
  @HttpCode(HttpStatus.OK)
  live(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Public()
  @Get('ready')
  async ready(@Res() res: Response): Promise<void> {
    const result = await this.healthService.checkReadiness();
    res
      .status(result.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE)
      .json(result);
  }
}
