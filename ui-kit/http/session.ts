/**
 * Punto de extensión hacia la sesión sin que el cliente HTTP conozca Zustand
 * ni el router (ui-kit no depende de negocio, docs/frontend/FOLDER_STRUCTURE.md
 * §6). `apps/web` registra un listener al montar `providers.tsx` que limpia
 * el `authSlice` y redirige a `/login` cuando el refresh también falla
 * (docs/frontend/API_LAYER.md §4, "sesión comprometida").
 */
type SessionExpiredListener = () => void;

let listener: SessionExpiredListener | null = null;

export function onSessionExpired(callback: SessionExpiredListener): void {
  listener = callback;
}

export function notifySessionExpired(): void {
  listener?.();
}
