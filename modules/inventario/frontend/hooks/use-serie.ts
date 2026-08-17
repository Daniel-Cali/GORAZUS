import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@gorazus/ui-kit';
import type { MovimientoRow } from './use-movimientos';

/** Fila real de `inventory.inventory_serials`. */
export interface SerieRow {
  id: string;
  product_id: string;
  warehouse_id: string | null;
  serial_number: string;
  status: string;
  unit_cost: string | null;
}

export function useSerie(serialNumber: string | undefined) {
  return useQuery({
    queryKey: ['inventario', 'series', 'detalle', serialNumber],
    queryFn: () => apiClient.get<SerieRow>(`/inventario/series/${serialNumber}`),
    enabled: !!serialNumber,
  });
}

/** A diferencia de Lotes, Series sí tiene endpoint dedicado de historial (`SeriesInventarioService.obtenerHistorial`, vía `stock_movements.serial_id`). */
export function useHistorialSerie(
  serialNumber: string | undefined,
  pagination: { page: number; pageSize: number },
) {
  return useQuery({
    queryKey: ['inventario', 'series', 'historial', serialNumber, pagination],
    queryFn: () =>
      apiClient.get<MovimientoRow[]>(`/inventario/series/${serialNumber}/historial`, {
        params: { page: pagination.page, pageSize: pagination.pageSize },
      }),
    enabled: !!serialNumber,
  });
}
