import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@gorazus/ui-kit';
import type { ContactoRecord } from './use-contactos';

export const contactoSchema = z.object({
  fullName: z.string().min(1, 'El nombre es obligatorio'),
  jobTitle: z.string().optional(),
  email: z.string().email('El email no es válido').optional().or(z.literal('')),
  phone: z.string().optional(),
  isPrimary: z.boolean().default(false),
});
export type ContactoInput = z.infer<typeof contactoSchema>;

export function useCrearContacto(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ContactoInput) =>
      apiClient.post<ContactoRecord>(`/clientes/${customerId}/contactos`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clientes', 'contactos', customerId] });
    },
  });
}

export function useActualizarContacto(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ContactoInput> }) =>
      apiClient.patch<ContactoRecord>(`/clientes/${customerId}/contactos/${id}`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clientes', 'contactos', customerId] });
    },
  });
}

export function useEliminarContacto(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<ContactoRecord>(`/clientes/${customerId}/contactos/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clientes', 'contactos', customerId] });
    },
  });
}
