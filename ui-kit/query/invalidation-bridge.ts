/**
 * Mismo patrón de indirección que `http/session.ts` (`onSessionExpired`):
 * `ui-kit` no puede depender de la instancia concreta de `QueryClient` (vive
 * en `apps/web/src/app/query-client.ts`, montada en `providers.tsx` —
 * ROUTING.md §6) sin invertir la regla de import de FOLDER_STRUCTURE.md §6
 * (`ui-kit/*` solo puede importar `packages/contracts`). `apps/web` registra
 * el invalidador real al arrancar; el `appStore` (`store/app.store.ts`) solo
 * conoce esta función indirecta.
 */
type Invalidator = () => Promise<unknown> | void;

let invalidator: Invalidator | null = null;

export function registerQueryInvalidator(fn: Invalidator): void {
  invalidator = fn;
}

export function invalidateAppQueries(): Promise<unknown> | void {
  return invalidator?.();
}
