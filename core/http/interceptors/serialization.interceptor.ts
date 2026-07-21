import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';

/**
 * Serialización de salida uniforme. Motivo concreto, no genérico:
 * `local_id BIGINT` (docs/database/sql/01_core.sql, patrón universal
 * de toda tabla) llega del cliente Prisma como `bigint` de JS, que
 * `JSON.stringify` no puede serializar (lanza TypeError) — se
 * normaliza acá una sola vez, en vez de que cada controller tenga que
 * acordarse de convertirlo.
 */
@Injectable()
export class SerializationInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => normalize(data)));
  }
}

function normalize(value: unknown): unknown {
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return value;
  // Prisma `Decimal` (ej. `tax_rates.rate_percentage`) es un objeto con
  // propiedades internas propias (`s`/`e`/`d` de decimal.js) y su propio
  // `toJSON`, no un objeto de datos plano — recorrerlo con
  // `Object.entries` como abajo destruye esa representación y deja
  // `{s,e,d}` crudo en la respuesta. Cualquier objeto con `toJSON` propio
  // se respeta tal cual (mismo criterio ya aplicado a `Date`) y que
  // `JSON.stringify` lo serialice normalmente.
  if (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as { toJSON?: unknown }).toJSON === 'function'
  ) {
    return value;
  }
  if (Array.isArray(value)) return value.map(normalize);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, normalize(val)]));
  }
  return value;
}
