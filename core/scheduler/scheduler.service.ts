import { Injectable } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

/**
 * Ver docs/architecture/32-core-platform/12-arbol-de-carpetas.md
 * (`Scheduler | core/scheduler/`). Envuelve `@nestjs/schedule` para
 * registro programático de jobs (`addCronJob`) — la carga dinámica de
 * `core.scheduled_jobs` (tabla con `cron_expression` por tenant, ver
 * docs/database/sql/01_core.sql y 29_partitioning.sql
 * "partition_maintenance") depende de Prisma (bloqueado, ver informe
 * EPIC 03) y se conecta acá cuando ese bloqueo se resuelva, sin
 * cambiar esta interfaz.
 */
@Injectable()
export class SchedulerService {
  constructor(private readonly registry: SchedulerRegistry) {}

  addCronJob(name: string, cronExpression: string, callback: () => void): void {
    const job = new CronJob(cronExpression, callback);
    this.registry.addCronJob(name, job);
    job.start();
  }

  removeCronJob(name: string): void {
    this.registry.deleteCronJob(name);
  }
}
