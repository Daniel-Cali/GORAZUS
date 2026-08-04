import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@gorazus/ui-kit';

/** Forma cruda devuelta por el backend (`core.roles` vía Prisma, sin transformar a DTO) — snake_case a propósito, mismo criterio que `UsuarioRecord`. */
export interface RolRecord {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  role_type: string;
  is_system_role: boolean;
  company_id: string | null;
  branch_id: string | null;
  created_at: string;
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
