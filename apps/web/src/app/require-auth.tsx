import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getAccessToken, initSession, Loader } from '@gorazus/ui-kit';

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
 */
export function RequireAuth() {
  const location = useLocation();
  const [checking, setChecking] = useState(!getAccessToken());

  useEffect(() => {
    if (getAccessToken()) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    void initSession().finally(() => {
      if (!cancelled) setChecking(false);
    });
    return () => {
      cancelled = true;
    };
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
