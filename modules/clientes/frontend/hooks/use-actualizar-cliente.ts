import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@gorazus/ui-kit';
import type { ClienteRecord } from './use-clientes';

export const actualizarClienteSchema = z.object({
  legalName: z.string().min(1, 'El nombre es obligatorio').optional(),
  tradeName: z.string().optional(),
  preferredCurrencyCode: z.string().length(3, 'El código de moneda debe tener 3 letras').optional(),
});
export type ActualizarClienteInput = z.infer<typeof actualizarClienteSchema>;

export function useActualizarCliente(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ActualizarClienteInput) =>
      apiClient.patch<ClienteRecord>(`/clientes/${id}`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clientes', 'detalle', id] });
      void queryClient.invalidateQueries({ queryKey: ['clientes', 'listado'] });
    },
  });
}
