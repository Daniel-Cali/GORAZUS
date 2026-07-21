import { Injectable } from '@nestjs/common';

export type HealthIndicator = () => Promise<boolean>;

/**
 * Ver docs/architecture/32-core-platform/07-observabilidad-y-gobernanza.md
 * ("verificación activa de conectividad, no solo configuración
 * presente") y trazabilidad §4 (`Health Checks | core/health/`).
 *
 * Diseño desacoplado a propósito: core/health NO importa PrismaClient,
 * ioredis ni amqplib — cada core/* (database, cache, messaging) se
 * registra a sí mismo cuando existe, vía `registerIndicator`, en su
 * propio módulo (`onModuleInit`). core/health no conoce ninguna
 * dependencia concreta, solo agrega resultados — así no se acopla al
 * orden en que se construye cada pieza del Core Platform (varias
 * siguen sin existir: core/cache, core/messaging; core/database existe
 * pero su cliente Prisma generado está bloqueado, ver informe EPIC 03).
 */
@Injectable()
export class HealthService {
  private readonly indicators = new Map<string, HealthIndicator>();

  registerIndicator(name: string, check: HealthIndicator): void {
    this.indicators.set(name, check);
  }

  async checkReadiness(): Promise<{ status: 'ok' | 'error'; checks: Record<string, boolean> }> {
    const checks: Record<string, boolean> = {};
    for (const [name, check] of this.indicators) {
      checks[name] = await check().catch(() => false);
    }
    const status = Object.values(checks).every(Boolean) ? 'ok' : 'error';
    return { status, checks };
  }
}
