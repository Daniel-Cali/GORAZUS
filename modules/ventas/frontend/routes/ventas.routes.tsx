import * as React from 'react';
import type { RouteObject } from 'react-router-dom';
import { RouteLoadingFallback } from '@gorazus/ui-kit';

const VentasDashboardPage = React.lazy(() =>
  import('../pages/ventas-dashboard.page').then((m) => ({ default: m.VentasDashboardPage })),
);
const FacturasListadoPage = React.lazy(() =>
  import('../pages/facturas-listado.page').then((m) => ({ default: m.FacturasListadoPage })),
);
const CotizacionesListadoPage = React.lazy(() =>
  import('../pages/cotizaciones-listado.page').then((m) => ({
    default: m.CotizacionesListadoPage,
  })),
);
const PedidosListadoPage = React.lazy(() =>
  import('../pages/pedidos-listado.page').then((m) => ({ default: m.PedidosListadoPage })),
);
const FacturaDetallePage = React.lazy(() =>
  import('../pages/factura-detalle.page').then((m) => ({ default: m.FacturaDetallePage })),
);
const CotizacionDetallePage = React.lazy(() =>
  import('../pages/cotizacion-detalle.page').then((m) => ({ default: m.CotizacionDetallePage })),
);
const CotizacionFormPage = React.lazy(() =>
  import('../pages/cotizacion-form.page').then((m) => ({ default: m.CotizacionFormPage })),
);

function conSuspense(elemento: React.ReactElement): React.ReactElement {
  return <React.Suspense fallback={<RouteLoadingFallback />}>{elemento}</React.Suspense>;
}

/**
 * Rutas de Ventas — Control Center + los 3 listados (Facturas/Cotizaciones/
 * Pedidos) + detalle de Factura + el flujo completo de Cotizaciones (crear/
 * editar/detalle con acciones de estado — Prompt V2 "Quotations frontend").
 * Convertir a pedido/factura, registrar recibo y el resto de los workflows
 * de Facturas/Pedidos quedan para una fase siguiente.
 */
export const ventasRoutes: RouteObject[] = [
  { path: '/ventas', element: conSuspense(<VentasDashboardPage />) },
  { path: '/ventas/facturas', element: conSuspense(<FacturasListadoPage />) },
  { path: '/ventas/facturas/:id', element: conSuspense(<FacturaDetallePage />) },
  { path: '/ventas/cotizaciones', element: conSuspense(<CotizacionesListadoPage />) },
  { path: '/ventas/cotizaciones/nueva', element: conSuspense(<CotizacionFormPage />) },
  { path: '/ventas/cotizaciones/:id', element: conSuspense(<CotizacionDetallePage />) },
  { path: '/ventas/cotizaciones/:id/editar', element: conSuspense(<CotizacionFormPage />) },
  { path: '/ventas/pedidos', element: conSuspense(<PedidosListadoPage />) },
];
