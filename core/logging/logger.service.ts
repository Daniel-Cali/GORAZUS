import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RequestContext } from './request-context';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Ver docs/architecture/32-core-platform/07-observabilidad-y-gobernanza.md §2.
 * Único punto de logging del proyecto — ningún módulo usa console.log
 * ni implementa su propio logger (docs/architecture/07 §6). Serializa
 * siempre a JSON sobre stdout/stderr; nunca escribe a archivo ni
 * conoce el destino final (Loki lo recolecta en staging/production vía
 * Promtail, ver 31-infraestructura-completa.md §9).
 */
@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly minLevel: LogLevel;

  constructor(private readonly configService: ConfigService) {
    this.minLevel = this.configService.get('NODE_ENV') === 'production' ? 'info' : 'debug';
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.write('debug', message, context);
  }

  log(message: string, context?: Record<string, unknown>): void {
    this.write('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.write('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.write('error', message, context);
  }

  private write(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return;

    const correlation = RequestContext.get();
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      requestId: correlation?.requestId,
      tenantId: correlation?.tenantId,
      userId: correlation?.userId,
      ...context,
    };

    const stream = level === 'error' ? console.error : console.log;
    stream(JSON.stringify(entry));
  }

  private shouldLog(level: LogLevel): boolean {
    const order: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return order.indexOf(level) >= order.indexOf(this.minLevel);
  }
}
