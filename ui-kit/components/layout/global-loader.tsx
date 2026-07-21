import { Loader } from '../primitives/loader';

/**
 * Overlay de pantalla completa — "Loader Global" pedido explícitamente.
 * Se muestra vía un store de Zustand (`apps/web/src/app/store/ui.store.ts`,
 * slice `isGlobalLoading`) suscrito a `ui-kit/http/request-tracker` (contador
 * de requests en vuelo del cliente HTTP, ver docs/frontend/API_LAYER.md §3),
 * para cualquier request en curso sin loader local propio.
 */
export function GlobalLoader({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/60 backdrop-blur-sm">
      <Loader className="h-8 w-8" />
    </div>
  );
}
