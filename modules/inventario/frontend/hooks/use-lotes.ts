import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@gorazus/ui-kit';

/** Fila real de `inventory.inventory_lots`. */
export interface LoteRow {
  id: string;
  product_id: string;
  warehouse_id: string | null;
  lot_number: string;
  expiry_date: string | null;
  remaining_quantity: string;
  metadata: Record<string, unknown>;
}

export function useLotes(params: {
  page: number;
  pageSize: number;
  productId?: string;
  warehouseId?: string;
}) {
  return useQuery({
    queryKey: ['inventario', 'lotes', 'listado', params],
    queryFn: () =>
      apiClient.get<LoteRow[]>('/inventario/lotes', {
        params: {
          page: params.page,
          pageSize: params.pageSize,
          ...(params.productId && { productId: params.productId }),
          ...(params.warehouseId && { warehouseId: params.warehouseId }),
        },
      }),
  });
}

export function useLotesProximosAVencer(
  dias: number,
  pagination: { page: number; pageSize: number },
) {
  return useQuery({
    queryKey: ['inventario', 'lotes', 'proximos-a-vencer', dias, pagination],
    queryFn: () =>
      apiClient.get<LoteRow[]>('/inventario/lotes/proximos-a-vencer', {
        params: { dias, page: pagination.page, pageSize: pagination.pageSize },
      }),
  });
}

export function useLotesVencidos(pagination: { page: number; pageSize: number }) {
  return useQuery({
    queryKey: ['inventario', 'lotes', 'vencidos', pagination],
    queryFn: () =>
      apiClient.get<LoteRow[]>('/inventario/lotes/vencidos', {
        params: { page: pagination.page, pageSize: pagination.pageSize },
      }),
  });
}
