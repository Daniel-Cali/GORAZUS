import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@gorazus/ui-kit';
import type { ClienteRecord } from './use-clientes';

export function useCliente(id: string | undefined) {
  return useQuery({
    queryKey: ['clientes', 'detalle', id],
    queryFn: () => apiClient.get<ClienteRecord>(`/clientes/${id}`),
    enabled: !!id,
  });
}
