import * as React from 'react';
import type { RouteObject } from 'react-router-dom';
import { RouteLoadingFallback } from '@gorazus/ui-kit';

const InventarioDashboardPage = React.lazy(() =>
  import('../pages/inventario-dashboard.page').then((m) => ({
    default: m.InventarioDashboardPage,
  })),
);
const StockListadoPage = React.lazy(() =>
  import('../pages/stock-listado.page').then((m) => ({ default: m.StockListadoPage })),
);
const MovimientosListadoPage = React.lazy(() =>
  import('../pages/movimientos-listado.page').then((m) => ({ default: m.MovimientosListadoPage })),
);
const LoteDetallePage = React.lazy(() =>
  import('../pages/lote-detalle.page').then((m) => ({ default: m.LoteDetallePage })),
);
const SerieDetallePage = React.lazy(() =>
  import('../pages/serie-detalle.page').then((m) => ({ default: m.SerieDetallePage })),
);

function conSuspense(elemento: React.ReactElement): React.ReactElement {
  return <React.Suspense fallback={<RouteLoadingFallback />}>{elemento}</React.Suspense>;
}

/**
 * Rutas de Inventario — solo las 5 pantallas construidas en este pase
 * (Control Center, Stock, Movimientos, Lote, Serie). Workflows de
 * Recepción/Salida/Transferencia/Ajuste, reglas WMS y mapa de almacén
 * quedan para una fase siguiente (ver informe final, "Next steps") — no se
 * agregan rutas vacías/placeholder para no aparentar una funcionalidad que
 * no existe (mismo criterio que `modules/clientes/frontend`).
 */
export const inventarioRoutes: RouteObject[] = [
  { path: '/inventario', element: conSuspense(<InventarioDashboardPage />) },
  { path: '/inventario/stock', element: conSuspense(<StockListadoPage />) },
  { path: '/inventario/movimientos', element: conSuspense(<MovimientosListadoPage />) },
  { path: '/inventario/lotes/:id', element: conSuspense(<LoteDetallePage />) },
  { path: '/inventario/series/:serialNumber', element: conSuspense(<SerieDetallePage />) },
];
