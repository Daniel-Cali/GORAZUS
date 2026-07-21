import { randomUUID } from 'node:crypto';

/**
 * Ver docs/architecture/32-core-platform/10-utilidades-comunes.md §1
 * (Common Utilities — función pura, sin estado, sin DI). No confundir
 * con el `id UUID` de cada tabla (generado en Postgres vía
 * `gen_random_uuid()`, ver docs/database/sql/01_core.sql) — esto es
 * para generar UUIDs en código de aplicación (idempotency keys,
 * correlación de eventos, etc.), no para IDs de fila.
 */
export function generateUuid(): string {
  return randomUUID();
}
