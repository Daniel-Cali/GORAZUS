import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { ComingSoonPage } from '@gorazus/ui-kit';
import { authRoutes } from '@gorazus/modules/auth';
import { dashboardRoutes } from '@gorazus/modules/dashboard';
import { seguridadRoutes } from '@gorazus/modules/seguridad';
import { posRoutes } from '@gorazus/modules/pos';
import { cajaRoutes } from '@gorazus/modules/caja-frontend';
import { clientesRoutes } from '@gorazus/modules/clientes-frontend';
import { inventarioRoutes } from '@gorazus/modules/inventario-frontend';
import { ventasRoutes } from '@gorazus/modules/ventas-frontend';
import { RequireAuth } from './require-auth';
import { AppShellLayout } from './app-shell/app-shell';
import { MODULE_REGISTRY } from './app-shell/module-registry';
import { NotFound } from './not-found.page';

/**
 * Única pieza que conoce las 25 features a la vez y las ensambla
 * (ROUTING.md §2). Cada `<x>.routes.tsx` de módulo ya trae su propio
 * `React.lazy()` — acá solo se concatenan los arrays.
 */
function ProtectedLayout() {
  return (
    <AppShellLayout>
      <Outlet />
    </AppShellLayout>
  );
}

const realRoutes = [
  ...dashboardRoutes,
  ...seguridadRoutes,
  ...cajaRoutes,
  ...clientesRoutes,
  ...inventarioRoutes,
  ...ventasRoutes,
];
// `posRoutes` cuenta para excluir `/pos` del catálogo de placeholders,
// pero se monta aparte (fuera de `ProtectedLayout`) — el POS no lleva
// `AppShell`, ocupa toda la pantalla (`POS_UX.md §1`).
const realPaths = new Set([...realRoutes, ...posRoutes].map((route) => route.path));

/**
 * FASE 03 Frontend Enterprise: cada feature del registro sin backend real
 * todavía (25 - 2 con ruta propia) recibe un placeholder honesto en vez de
 * datos mock (decisión explícita del usuario) — generado automáticamente
 * desde `MODULE_REGISTRY` en vez de 20+ archivos de página casi idénticos.
 */
const placeholderRoutes = MODULE_REGISTRY.filter(
  (entry) => entry.id !== 'dashboard' && !realPaths.has(entry.path),
).map((entry) => ({
  path: entry.path,
  element: <ComingSoonPage moduleLabel={entry.label} />,
}));

export const router = createBrowserRouter([
  ...authRoutes,
  {
    element: <RequireAuth />,
    children: [
      ...posRoutes,
      {
        element: <ProtectedLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          ...realRoutes,
          ...placeholderRoutes,
        ],
      },
    ],
  },
  { path: '*', element: <NotFound /> },
]);
