import * as React from 'react';
import type { RouteObject } from 'react-router-dom';
import { RouteLoadingFallback } from '@gorazus/ui-kit';

const CajaPage = React.lazy(() =>
  import('../pages/caja.page').then((m) => ({ default: m.CajaPage })),
);

function conSuspense(elemento: React.ReactElement): React.ReactElement {
  return <React.Suspense fallback={<RouteLoadingFallback />}>{elemento}</React.Suspense>;
}

/** Ruta de Caja — coincide con `module-registry.ts` (`id: 'caja'`, `path: '/caja'`), reemplaza el placeholder `ComingSoonPage`. */
export const cajaRoutes: RouteObject[] = [{ path: '/caja', element: conSuspense(<CajaPage />) }];
