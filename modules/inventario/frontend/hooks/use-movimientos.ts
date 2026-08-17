import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@gorazus/ui-kit';

/** Fila real de `inventory.stock_movements` (`MovimientosController.listar`). */
export interface MovimientoRow {
  id: string;
  created_at: string;
  product_id: string;
  warehouse_id: string;
  movement_type_id: string;
  quantity: string;
  unit_cost: string | null;
  source_module: string | null;
  source_entity_id: string | null;
  lot_id: string | null;
  serial_id: string | null;
  created_by: string | null;
}

export function useMovimientos(params: {
  page: number;
  pageSize: number;
  productId?: string;
  warehouseId?: string;
}) {
  return useQuery({
    queryKey: ['inventario', 'movimientos', 'listado', params],
    queryFn: () =>
      apiClient.get<MovimientoRow[]>('/inventario/movimientos', {
        params: {
          page: params.page,
          pageSize: params.pageSize,
          ...(params.productId && { productId: params.productId }),
          ...(params.warehouseId && { warehouseId: params.warehouseId }),
        },
      }),
  });
}
