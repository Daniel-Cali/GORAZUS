import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { LoggerService } from '@gorazus/core-logging';
import { DomainException } from '../exceptions/domain.exception';

/**
 * Filtro global — ver docs/architecture/32-core-platform/07-observabilidad-y-gobernanza.md §3.
 * Contrato de error: docs/architecture/07-convenciones-y-estandares.md
 * §"Formato de error" (inspirado en RFC 7807, no idéntico).
 *
 * Nunca expone detalle interno (stack trace, nombre de tabla, query) al
 * cliente — solo al log server-side.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof DomainException) {
      response.status(exception.httpStatus).json({
        error: {
          code: exception.code,
          message: exception.message,
          details: exception.details,
        },
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      response.status(status).json({
        error: {
          code: `HTTP_${status}`,
          message: exception.message,
          details: [],
        },
      });
      return;
    }

    // Error técnico inesperado: se loguea completo server-side, el
    // cliente nunca recibe el detalle interno.
    this.logger.error('Excepción no controlada', {
      error: exception instanceof Error ? exception.stack : String(exception),
    });
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: 'ERR_INTERNAL',
        message: 'Ocurrió un error inesperado',
        details: [],
      },
    });
  }
}
