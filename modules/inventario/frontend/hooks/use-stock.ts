import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@gorazus/ui-kit';

/** Fila real de `inventory.stock` (`StockController.listar`) — sin nombre/SKU de producto, el schema de Inventario no lo desnormaliza (cross-schema hacia `products`, ver "Known limitations"). */
export interface StockRow {
  id: string;
  product_id: string;
  warehouse_id: string;
  location_id: string | null;
  quantity_on_hand: string;
  quantity_reserved: string;
  updated_at: string;
}

export function useStock(params: {
  page: number;
  pageSize: number;
  productId?: string;
  warehouseId?: string;
}) {
  return useQuery({
    queryKey: ['inventario', 'stock', 'listado', params],
    queryFn: () =>
      apiClient.get<StockRow[]>('/inventario/stock', {
        params: {
          page: params.page,
          pageSize: params.pageSize,
          ...(params.productId && { productId: params.productId }),
          ...(params.warehouseId && { warehouseId: params.warehouseId }),
        },
      }),
  });
}
