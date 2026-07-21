import { useMutation } from '@tanstack/react-query';
import { apiClient, setAccessToken } from '@gorazus/ui-kit';
// eslint-disable-next-line @nx/enforce-module-boundaries -- `shared/` se importa por ruta relativa dentro del mismo módulo, nunca por nombre de paquete (ver modules/auth/shared/package.json)
import type { LoginInput, LoginResponse } from '../../shared/contracts/login.types';

/** `useMutation`, nunca un `useEffect` disparando el POST (STATE_MANAGEMENT.md §2.3). */
export function useLogin() {
  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const response = await apiClient.post<LoginResponse>('/auth/login', input);
      setAccessToken(response.data.accessToken);
      return response.data;
    },
  });
}
