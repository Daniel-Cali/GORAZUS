import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render } from '@testing-library/react';

/** QueryClient nuevo por test — sin reintentos (evita que un mock de error tarde por los reintentos default de TanStack Query) y sin caché entre tests. */
export function crearQueryClientDeTest(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

/** Render con QueryClientProvider + MemoryRouter — mismo patrón mínimo en cada módulo de frontend (no se comparte entre `type:frontend` por la restricción de fronteras ya documentada en los hooks).
 * `rutasDestino` registra rutas mínimas adicionales (sin contenido) para que un `navigate(...)` disparado durante el test tenga a dónde matchear, evitando el warning "No routes matched location" de React Router. */
export function renderConProviders(
  ui: React.ReactElement,
  options: { ruta?: string; path?: string; rutasDestino?: string[] } = {},
) {
  const queryClient = crearQueryClientDeTest();
  const { ruta = '/', path = '/', rutasDestino = [] } = options;
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route path={path} element={ui} />
          {rutasDestino.map((destino) => (
            <Route key={destino} path={destino} element={null} />
          ))}
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
