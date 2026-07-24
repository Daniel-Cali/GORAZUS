import * as React from 'react';
import type { RouteObject } from 'react-router-dom';
import { RouteLoadingFallback } from '@gorazus/ui-kit';

const PosPage = React.lazy(() => import('../pages/pos.page').then((m) => ({ default: m.PosPage })));

/**
 * Fuera de `AppShell` — el POS ocupa toda la pantalla, sin menú de
 * navegación (`POS_UX.md §1`). Requiere sesión (a diferencia de
 * `authRoutes`) pero se monta como hermana de la raíz protegida, no
 * dentro de `ProtectedLayout` — ver `apps/web/src/app/router.tsx`.
 */
export const posRoutes: RouteObject[] = [
  {
    path: '/pos',
    element: (
      <React.Suspense fallback={<RouteLoadingFallback />}>
        <PosPage />
      </React.Suspense>
    ),
  },
];
