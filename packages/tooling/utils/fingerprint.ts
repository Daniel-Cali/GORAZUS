import { createHash } from 'node:crypto';

/**
 * Ver docs/architecture/32-core-platform/10-utilidades-comunes.md §1
 * (Common Utilities — función pura, sin estado, sin DI), mismo criterio
 * que `uuid.ts`/`hash.ts`. Fingerprint determinista de un payload — usado
 * por la idempotencia de POST /pos/ventas (P0-1) para detectar cuándo una
 * `idempotencyKey` reutilizada trae un payload distinto al original
 * (mismo intento lógico vs. una venta nueva con la clave equivocada).
 *
 * Serialización estable: ordena las claves de cualquier objeto anidado
 * antes de stringificar, así el mismo contenido lógico produce siempre el
 * mismo hash sin importar el orden real de las propiedades en el JSON de
 * entrada. NO reordena arrays — el orden de `lines`/`payments` sí es
 * semánticamente relevante para una venta (dos líneas del mismo producto
 * en distinto orden son igual de válidas, pero no es este util el que
 * debe decidir eso; lo trata como dato, no lo normaliza).
 */
function ordenarClaves(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(ordenarClaves);
  if (valor !== null && typeof valor === 'object') {
    const entradas = Object.entries(valor as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    return Object.fromEntries(entradas.map(([clave, val]) => [clave, ordenarClaves(val)]));
  }
  return valor;
}

export function computeFingerprint(payload: unknown): string {
  const json = JSON.stringify(ordenarClaves(payload));
  return createHash('sha256').update(json).digest('hex');
}
