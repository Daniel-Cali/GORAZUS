import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@gorazus/ui-kit';

/** Forma cruda devuelta por el backend (`core.users` vía Prisma, sin transformar a DTO) — snake_case a propósito, es lo que la API realmente responde hoy. */
export interface UsuarioRecord {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export function useUsuarios(page: number, pageSize = 20) {
  return useQuery({
    queryKey: ['seguridad', 'usuarios', page, pageSize],
    queryFn: () =>
      apiClient.get<UsuarioRecord[]>('/seguridad/usuarios', { params: { page, pageSize } }),
  });
}
