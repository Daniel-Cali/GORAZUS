import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { ZodSchema } from 'zod';
import { ValidationException } from '../exceptions/validation.exception';

/**
 * Ver docs/architecture/12-backend-enterprise.md §"Validación de forma
 * del body": `core/http/pipes/zod-validation.pipe.ts` + validators de
 * cada módulo. No usa `class-validator` — Zod es el validador único del
 * proyecto (ya elegido para env.schema.ts y packages/contracts).
 * Uso: `@Body(new ZodValidationPipe(crearVentaSchema)) dto: CrearVentaDto`.
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new ValidationException(result.error.issues);
    }
    return result.data;
  }
}
