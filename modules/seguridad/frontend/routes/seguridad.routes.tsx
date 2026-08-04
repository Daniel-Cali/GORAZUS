import * as React from 'react';
import type { RouteObject } from 'react-router-dom';
import { RouteLoadingFallback } from '@gorazus/ui-kit';

const UsuariosListadoPage = React.lazy(() =>
  import('../pages/usuarios-listado.page').then((m) => ({ default: m.UsuariosListadoPage })),
);
const RolesListadoPage = React.lazy(() =>
  import('../pages/roles-listado.page').then((m) => ({ default: m.RolesListadoPage })),
);

/** Anidado bajo `<RequireAuth>` + `AppShell` (ROUTING.md §2, §4). Único módulo de este lote con backend real detrás. */
export const seguridadRoutes: RouteObject[] = [
  {
    path: '/seguridad/usuarios',
    element: (
      <React.Suspense fallback={<RouteLoadingFallback />}>
        <UsuariosListadoPage />
      </React.Suspense>
    ),
  },
  {
    path: '/seguridad/roles',
    element: (
      <React.Suspense fallback={<RouteLoadingFallback />}>
        <RolesListadoPage />
      </React.Suspense>
    ),
  },
];
