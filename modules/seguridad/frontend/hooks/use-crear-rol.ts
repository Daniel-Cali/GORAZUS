import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@gorazus/ui-kit';
import type { RolRecord } from './use-roles';

export interface CrearRolInput {
  name: string;
  code?: string | null;
  description?: string | null;
  roleType?: 'tenant' | 'company' | 'branch' | 'custom';
}

export function useCrearRol() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CrearRolInput) => apiClient.post<RolRecord>('/seguridad/roles', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['seguridad', 'roles'] });
    },
  });
}
