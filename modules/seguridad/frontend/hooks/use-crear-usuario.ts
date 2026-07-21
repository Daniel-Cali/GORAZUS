import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@gorazus/ui-kit';
// eslint-disable-next-line @nx/enforce-module-boundaries -- `shared/` se importa por ruta relativa dentro del mismo módulo, nunca por nombre de paquete (ver modules/auth/shared/package.json)
import type { CrearUsuarioInput } from '../../shared/contracts/usuarios.schema';
import type { UsuarioRecord } from './use-usuarios';

interface CrearUsuarioResponse {
  usuario: UsuarioRecord;
  passwordTemporal: string;
}

export function useCrearUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CrearUsuarioInput) =>
      apiClient.post<CrearUsuarioResponse>('/seguridad/usuarios', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['seguridad', 'usuarios'] });
    },
  });
}
