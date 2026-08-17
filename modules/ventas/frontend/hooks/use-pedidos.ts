import { useQuery } from '@tanstack/react-query';
import { apiClient, useAppStore } from '@gorazus/ui-kit';

/** Fila real de `sales.sales_orders` (`PedidosVentaController.listar`). */
export interface PedidoRow {
  id: string;
  document_number: string;
  customer_id: string;
  branch_id: string;
  status_id: string;
  quote_id: string | null;
  sales_channel: string;
  currency_code: string;
  total_amount: string;
  created_at: string;
}

export function usePedidos(params: {
  page: number;
  pageSize: number;
  branchId?: string;
  customerId?: string;
  statusId?: string;
}) {
  const companyId = useAppStore((s) => s.activeCompanyId);
  return useQuery({
    queryKey: ['ventas', 'pedidos', 'listado', companyId, params],
    queryFn: () =>
      apiClient.get<PedidoRow[]>('/ventas/pedidos', {
        params: {
          companyId: companyId ?? undefined,
          page: params.page,
          pageSize: params.pageSize,
          ...(params.branchId && { branchId: params.branchId }),
          ...(params.customerId && { customerId: params.customerId }),
          ...(params.statusId && { statusId: params.statusId }),
        },
      }),
    enabled: !!companyId,
  });
}

export interface SalesOrderLineRow {
  id: string;
  product_id: string;
  quantity: string;
  unit_price: string;
  discount_percentage: string;
  invoiced_quantity?: string;
}

export interface PedidoConLineasRow extends PedidoRow {
  sales_order_lines: SalesOrderLineRow[];
}

export function usePedido(id: string | undefined) {
  return useQuery({
    queryKey: ['ventas', 'pedidos', 'detalle', id],
    queryFn: () => apiClient.get<PedidoConLineasRow>(`/ventas/pedidos/${id}`),
    enabled: !!id,
  });
}
