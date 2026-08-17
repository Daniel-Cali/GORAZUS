import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@gorazus/ui-kit';

/** Fila real de `configuration.currencies` (`MonedasController.listar`) — catálogo real, usado por el formulario de Cotización para no dejar `currencyCode` fijo. */
export interface MonedaRow {
  id: string;
  iso_code: string;
  symbol: string | null;
}

export function useMonedas() {
  return useQuery({
    queryKey: ['ventas', 'monedas'],
    queryFn: () =>
      apiClient.get<MonedaRow[]>('/configuracion/monedas', { params: { pageSize: 50 } }),
    staleTime: 5 * 60 * 1000,
  });
}
