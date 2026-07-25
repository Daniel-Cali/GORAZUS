import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { apiClient, getAccessToken, initSession, useAppStore, Loader } from '@gorazus/ui-kit';

/**
 * Envuelve el árbol completo de rutas autenticadas (docs/frontend/ROUTING.md
 * §5.1). Vive en `apps/web` y no en `ui-kit` porque necesita react-router
 * (`ui-kit` no depende de react-router-dom, ver docs/frontend/FOLDER_STRUCTURE.md
 * §6). Preserva la ruta destino en `?redirect=` para volver ahí tras login.
 *
 * `initSession()` — bug real corregido en FASE 05 (2026-07-20, encontrado con
 * Playwright real: navegar directo a una ruta protegida después de loguearse
 * volvía a /login). El access token vive solo en memoria (nunca localStorage,
 * ver `token-store.ts`) — CUALQUIER recarga completa de página lo pierde. Sin
 * intentar restaurarlo desde la cookie httpOnly de refresh antes de decidir
 * si redirige, el usuario pierde la sesión en cada F5/link directo aunque su
 * cookie siga siendo válida.
 *
 * `restoreUser()` — bug visual real corregido en FASE 06 (auditoría de UI,
 * encontrado con Playwright real: tras un `page.goto` a una ruta protegida,
 * "Hola, {nombre}" del Dashboard y el nombre del Topbar desaparecían).
 * `useAppStore` excluye `user` de `partialize` a propósito (nunca queda
 * `fullName`/`email` en `localStorage`), así que `initSession()` reponía el
 * access token pero nadie repoblaba el store — la sesión seguía activa pero
 * la personalización quedaba en blanco hasta un logout/login manual. Usa
 * `GET /auth/me`, ya existente desde FASE 03 Parte 02, sin tocar el backend.
 */
export function RequireAuth() {
  const location = useLocation();
  const [checking, setChecking] = useState(!getAccessToken());
  const user = useAppStore((s) => s.user);
  const setSession = useAppStore((s) => s.setSession);

  useEffect(() => {
    async function restoreUser() {
      try {
        const response = await apiClient.get<{
          id: string;
          fullName: string;
          email: string;
          activeCompanyId: string | null;
          activeBranchId: string | null;
        }>('/auth/me');
        setSession(
          { id: response.data.id, name: response.data.fullName, email: response.data.email },
          response.data.activeCompanyId,
          response.data.activeBranchId,
        );
      } catch {
        // Best-effort — si falla, el usuario sigue autenticado, solo sin
        // personalización hasta la próxima navegación o login manual.
      }
    }

    if (getAccessToken()) {
      if (!user) void restoreUser();
      setChecking(false);
      return;
    }
    let cancelled = false;
    void initSession().then(async (restored) => {
      if (cancelled) return;
      if (restored) await restoreUser();
      setChecking(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo debe correr al montar, `user`/`setSession` se leen del store en el momento de ejecutarse
  }, []);

  if (checking) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader className="h-6 w-6" />
      </div>
    );
  }

  if (!getAccessToken()) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return <Outlet />;
}
