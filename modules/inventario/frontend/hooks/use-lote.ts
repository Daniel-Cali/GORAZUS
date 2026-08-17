import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@gorazus/ui-kit';
import type { LoteRow } from './use-lotes';
import type { MovimientoRow } from './use-movimientos';

export function useLote(id: string | undefined) {
  return useQuery({
    queryKey: ['inventario', 'lotes', 'detalle', id],
    queryFn: () => apiClient.get<LoteRow>(`/inventario/lotes/${id}`),
    enabled: !!id,
  });
}

/**
 * "Timeline de trazabilidad" de un lote — no existe un endpoint dedicado
 * `/inventario/lotes/:id/historial` (a diferencia de Series, que sí lo
 * tiene). Se arma filtrando `/inventario/movimientos` por `productId`
 * client-side sobre `lot_id` (el backend no expone `lotId` como filtro de
 * movimientos todavía) — ver "Known limitations" del informe final.
 */
export function useHistorialLote(loteId: string | undefined, productId: string | undefined) {
  return useQuery({
    queryKey: ['inventario', 'movimientos', 'por-lote', loteId],
    queryFn: async () => {
      const respuesta = await apiClient.get<MovimientoRow[]>('/inventario/movimientos', {
        params: { productId, pageSize: 100 },
      });
      return respuesta.data.filter((m) => m.lot_id === loteId);
    },
    enabled: !!loteId && !!productId,
  });
}
