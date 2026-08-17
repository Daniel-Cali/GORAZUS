import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@gorazus/ui-kit';

/** Fila real de `customers` (`ClientesController.obtener`) — solo los campos que la UI de Ventas necesita mostrar. */
export interface ClienteRow {
  id: string;
  legal_name: string;
  trade_name: string | null;
  tax_id: string;
}

/** Un solo lookup por id (no N+1 sobre listados) — usado en las páginas de detalle de documentos de venta. */
export function useCliente(id: string | undefined) {
  return useQuery({
    queryKey: ['clientes', 'detalle', id],
    queryFn: () => apiClient.get<ClienteRow>(`/clientes/${id}`),
    enabled: !!id,
  });
}
