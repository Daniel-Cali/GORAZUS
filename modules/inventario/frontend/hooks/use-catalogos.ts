import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@gorazus/ui-kit';

export interface Almacen {
  id: string;
  company_id: string;
  branch_id: string | null;
  name: string;
}

export interface TipoMovimiento {
  id: string;
  code: string;
  direction: string;
}

/** Catálogos de referencia — `staleTime` largo, cambian con muy poca frecuencia (altas de almacén/tipo de movimiento son eventos raros). */
const STALE_TIME_CATALOGO = 5 * 60_000;

export function useAlmacenes() {
  return useQuery({
    queryKey: ['inventario', 'almacenes', 'catalogo'],
    queryFn: () => apiClient.get<Almacen[]>('/inventario/almacenes', { params: { pageSize: 100 } }),
    staleTime: STALE_TIME_CATALOGO,
  });
}

export function useTiposMovimiento() {
  return useQuery({
    queryKey: ['inventario', 'tipos-movimiento', 'catalogo'],
    queryFn: () =>
      apiClient.get<TipoMovimiento[]>('/inventario/tipos-movimiento', { params: { pageSize: 50 } }),
    staleTime: STALE_TIME_CATALOGO,
  });
}
