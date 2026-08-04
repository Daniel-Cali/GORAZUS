import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@gorazus/ui-kit';
import type { RolRecord } from './use-roles';

/** Baja lógica — un rol de fábrica lo rechaza con 409, ver `RolDeFabricaException`. */
export function useEliminarRol() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<RolRecord>(`/seguridad/roles/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['seguridad', 'roles'] });
    },
  });
}
