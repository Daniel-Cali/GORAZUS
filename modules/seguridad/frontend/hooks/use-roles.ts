import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@gorazus/ui-kit';

export interface RolRecord {
  id: string;
  name: string;
  is_system_role: boolean;
}

export function useRoles() {
  return useQuery({
    queryKey: ['seguridad', 'roles'],
    queryFn: () =>
      apiClient.get<RolRecord[]>('/seguridad/roles', { params: { page: 1, pageSize: 100 } }),
  });
}

export function useAsignarRol() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, rolId }: { userId: string; rolId: string }) =>
      apiClient.post<{ userId: string; rolId: string }>(`/seguridad/usuarios/${userId}/roles`, {
        rolId,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['seguridad', 'usuarios'] });
    },
  });
}
