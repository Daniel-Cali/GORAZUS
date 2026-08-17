import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';

/** QueryClient nuevo por test — sin reintentos, sin caché entre tests. Mismo patrón que `modules/ventas/frontend/test/test-utils.tsx`, duplicado por la restricción de fronteras `type:frontend`. */
export function crearQueryClientDeTest(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function renderConProviders(ui: React.ReactElement) {
  const queryClient = crearQueryClientDeTest();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}
