import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@gorazus/ui-kit';
import type { UsuarioRecord } from './use-usuarios';

export function useDesactivarUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiClient.post<UsuarioRecord>(`/seguridad/usuarios/${userId}/desactivar`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['seguridad', 'usuarios'] });
    },
  });
}
