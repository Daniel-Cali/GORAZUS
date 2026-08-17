import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@gorazus/ui-kit';
import type { ClienteRecord } from './use-clientes';

export const crearClienteSchema = z.object({
  companyId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  legalName: z.string().min(1, 'El nombre es obligatorio'),
  taxId: z.string().min(1, 'El identificador fiscal es obligatorio'),
  tradeName: z.string().optional(),
  preferredCurrencyCode: z
    .string()
    .length(3, 'El código de moneda debe tener 3 letras (ISO 4217)')
    .default('USD'),
});
export type CrearClienteInput = z.infer<typeof crearClienteSchema>;

export function useCrearCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CrearClienteInput) => apiClient.post<ClienteRecord>('/clientes', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clientes', 'listado'] });
    },
  });
}
