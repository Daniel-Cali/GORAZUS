import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@gorazus/ui-kit';

/** Forma cruda devuelta por el backend (`customers.customers` vía Prisma, snake_case a propósito). */
export interface ClienteRecord {
  id: string;
  company_id: string;
  branch_id: string | null;
  legal_name: string;
  trade_name: string | null;
  tax_id: string;
  preferred_currency_code: string;
  is_blocked: boolean;
  created_at: string;
}

export function useClientes(page: number, pageSize: number, query: string | undefined) {
  return useQuery({
    queryKey: ['clientes', 'listado', page, pageSize, query],
    queryFn: () =>
      apiClient.get<ClienteRecord[]>('/clientes', {
        params: { page, pageSize, ...(query && { query }) },
      }),
  });
}
