import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain.exception';

/**
 * Ver core/http/exceptions/domain.exception.ts. Categoría separada de
 * DomainException porque el filtro global (§3 de 32-core-platform/07)
 * distingue "error de validación de forma" de "regla de negocio
 * violada" aunque ambas terminen en 4xx — código de aplicación
 * estable `ERR_VALIDATION_FAILED`, `details` con el detalle por campo.
 */
export class ValidationException extends DomainException {
  constructor(details: unknown[]) {
    super(
      'ERR_VALIDATION_FAILED',
      'La solicitud no pasó la validación',
      HttpStatus.BAD_REQUEST,
      details,
    );
  }
}
