import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@gorazus/ui-kit';

export interface ContactoRecord {
  id: string;
  customer_id: string;
  full_name: string;
  job_title: string | null;
  email: string | null;
  phone: string | null;
  is_primary: boolean;
}

export function useContactos(customerId: string | undefined) {
  return useQuery({
    queryKey: ['clientes', 'contactos', customerId],
    queryFn: () =>
      apiClient.get<ContactoRecord[]>(`/clientes/${customerId}/contactos`, {
        params: { page: 1, pageSize: 100 },
      }),
    enabled: !!customerId,
  });
}
