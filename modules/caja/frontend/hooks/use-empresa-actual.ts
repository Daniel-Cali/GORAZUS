import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@gorazus/ui-kit';

/** Mismo patrón que `cash-register-gate.tsx` (POS) para resolver la moneda real de la empresa — duplicado local por la misma razón de siempre: `type:frontend` no puede importar otro `type:frontend`. */
export interface EmpresaActualRow {
  id: string;
  functional_currency_code: string;
}

export function useEmpresaActual(companyId: string | undefined) {
  return useQuery({
    queryKey: ['caja', 'empresas'],
    queryFn: () =>
      apiClient.get<EmpresaActualRow[]>('/configuracion/empresas', {
        params: { page: 1, pageSize: 50 },
      }),
    select: (response) => response.data.find((e) => e.id === companyId),
    enabled: !!companyId,
  });
}
