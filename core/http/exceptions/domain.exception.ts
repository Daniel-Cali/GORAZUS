import { HttpStatus } from '@nestjs/common';

/**
 * Base de la jerarquía de excepciones de negocio — ver
 * docs/architecture/32-core-platform/07-observabilidad-y-gobernanza.md §3
 * y docs/architecture/07-convenciones-y-estandares.md §"Formato de error".
 * Cada módulo extiende esta clase para sus propias excepciones
 * (`CreditLimitExceededException extends DomainException`), nunca lanza
 * un `Error` genérico ni un `HttpException` de Nest directamente para
 * reglas de negocio.
 */
export class DomainException extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly details: unknown[] = [],
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}
