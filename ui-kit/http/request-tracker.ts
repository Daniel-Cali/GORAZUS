/**
 * Contador de requests en vuelo — el `GlobalLoader` (ui-kit/components/layout)
 * se activa desde `apps/web` suscribiendo este contador al `uiSlice` de
 * Zustand, en vez de que cada pantalla prenda/apague su propio loader
 * (docs/frontend/API_LAYER.md §3, ver comentario en global-loader.tsx).
 */
type Listener = (activeCount: number) => void;

let activeCount = 0;
const listeners = new Set<Listener>();

export function subscribeActiveRequests(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function trackRequestStart(): void {
  activeCount += 1;
  listeners.forEach((listener) => listener(activeCount));
}

export function trackRequestEnd(): void {
  activeCount = Math.max(0, activeCount - 1);
  listeners.forEach((listener) => listener(activeCount));
}
