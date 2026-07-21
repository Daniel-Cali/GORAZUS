import * as React from 'react';
import type { RouteObject } from 'react-router-dom';
import { RouteLoadingFallback } from '@gorazus/ui-kit';

const DashboardPage = React.lazy(() =>
  import('../pages/dashboard.page').then((m) => ({ default: m.DashboardPage })),
);

/** Anidado bajo `<RequireAuth>` + `AppShell` en `apps/web/src/app/router.tsx` (ROUTING.md §2, §4). */
export const dashboardRoutes: RouteObject[] = [
  {
    path: '/dashboard',
    element: (
      <React.Suspense fallback={<RouteLoadingFallback />}>
        <DashboardPage />
      </React.Suspense>
    ),
  },
];
