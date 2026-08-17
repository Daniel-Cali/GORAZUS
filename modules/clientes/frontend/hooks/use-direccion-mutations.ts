import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@gorazus/ui-kit';
import type { DireccionRecord } from './use-direcciones';

/** Valores reales del CHECK `customer_addresses_address_type_check` en la base. */
export const TIPOS_DIRECCION = ['billing', 'shipping', 'other'] as const;

export const direccionSchema = z.object({
  addressType: z.enum(TIPOS_DIRECCION),
  line1: z.string().min(1, 'La línea 1 es obligatoria'),
  line2: z.string().optional(),
  municipalityId: z.string().uuid().optional().or(z.literal('')),
  postalCode: z.string().optional(),
  isDefault: z.boolean().default(false),
});
export type DireccionInput = z.infer<typeof direccionSchema>;

export function useCrearDireccion(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DireccionInput) =>
      apiClient.post<DireccionRecord>(`/clientes/${customerId}/direcciones`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clientes', 'direcciones', customerId] });
    },
  });
}

export function useActualizarDireccion(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<DireccionInput> }) =>
      apiClient.patch<DireccionRecord>(`/clientes/${customerId}/direcciones/${id}`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clientes', 'direcciones', customerId] });
    },
  });
}

export function useEliminarDireccion(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<DireccionRecord>(`/clientes/${customerId}/direcciones/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clientes', 'direcciones', customerId] });
    },
  });
}
