import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@gorazus/ui-kit';
import type { RolRecord } from './use-roles';

/** Backend solo admite renombrar (`RolesService.actualizar` toma solo `name`) — un rol de fábrica lo rechaza con 409, ver `RolDeFabricaException`. */
export function useRenombrarRol() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      apiClient.patch<RolRecord>(`/seguridad/roles/${id}`, { name }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['seguridad', 'roles'] });
    },
  });
}
