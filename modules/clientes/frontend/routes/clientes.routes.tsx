import * as React from 'react';
import type { RouteObject } from 'react-router-dom';
import { RouteLoadingFallback } from '@gorazus/ui-kit';

const ClientesListadoPage = React.lazy(() =>
  import('../pages/clientes-listado.page').then((m) => ({ default: m.ClientesListadoPage })),
);
const ClienteDetallePage = React.lazy(() =>
  import('../pages/cliente-detalle.page').then((m) => ({ default: m.ClienteDetallePage })),
);

/** Anidado bajo `<RequireAuth>` + `AppShell` (ROUTING.md §2, §4). */
export const clientesRoutes: RouteObject[] = [
  {
    path: '/clientes',
    element: (
      <React.Suspense fallback={<RouteLoadingFallback />}>
        <ClientesListadoPage />
      </React.Suspense>
    ),
  },
  {
    path: '/clientes/:id',
    element: (
      <React.Suspense fallback={<RouteLoadingFallback />}>
        <ClienteDetallePage />
      </React.Suspense>
    ),
  },
];
