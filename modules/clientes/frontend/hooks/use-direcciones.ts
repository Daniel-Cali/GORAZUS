import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@gorazus/ui-kit';

export interface DireccionRecord {
  id: string;
  customer_id: string;
  address_type: string;
  line1: string;
  line2: string | null;
  municipality_id: string | null;
  postal_code: string | null;
  is_default: boolean;
}

export function useDirecciones(customerId: string | undefined) {
  return useQuery({
    queryKey: ['clientes', 'direcciones', customerId],
    queryFn: () =>
      apiClient.get<DireccionRecord[]>(`/clientes/${customerId}/direcciones`, {
        params: { page: 1, pageSize: 100 },
      }),
    enabled: !!customerId,
  });
}
