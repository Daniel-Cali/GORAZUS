import * as React from 'react';
import type { RouteObject } from 'react-router-dom';
import { RouteLoadingFallback } from '@gorazus/ui-kit';

const LoginPage = React.lazy(() =>
  import('../pages/login.page').then((m) => ({ default: m.LoginPage })),
);

/**
 * Fuera de `<RequireAuth>` y sin `AppShell` — `auth` no tiene menú de
 * navegación (docs/menus/00-convenciones.md §6). `apps/web/src/app/router.tsx`
 * monta este array como rutas hermanas de la raíz autenticada (ROUTING.md §2, §5.1).
 */
export const authRoutes: RouteObject[] = [
  {
    path: '/login',
    element: (
      <React.Suspense fallback={<RouteLoadingFallback />}>
        <LoginPage />
      </React.Suspense>
    ),
  },
];
