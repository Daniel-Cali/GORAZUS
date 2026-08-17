import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@gorazus/ui-kit';

/** Fila real de `customers.customers` (`ClientesController.listar`) — mismo shape que `modules/clientes/frontend/hooks/use-clientes.ts`, duplicado a propósito: `type:frontend` no puede depender de otro `type:frontend` (`eslint.config.mjs`), cada módulo de frontend es independiente. */
export interface ClienteBusquedaRow {
  id: string;
  legal_name: string;
  tax_id: string;
}

/** Buscador de clientes para el selector de Cotizaciones — `GET /clientes` ya soporta `query` (nombre/RFC) del lado del backend. */
export function useClientesBusqueda(query: string) {
  return useQuery({
    queryKey: ['ventas', 'clientes-busqueda', query],
    queryFn: () =>
      apiClient.get<ClienteBusquedaRow[]>('/clientes', {
        params: { page: 1, pageSize: 20, ...(query && { query }) },
      }),
  });
}
