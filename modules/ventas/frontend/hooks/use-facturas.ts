import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@gorazus/ui-kit';

/** Fila real de `sales.invoices` (`FacturasController.listar`) — sin nombre de cliente, ver `format-id.ts`. */
export interface FacturaRow {
  id: string;
  document_number: string;
  customer_id: string;
  branch_id: string;
  status_id: string;
  sales_channel: string;
  currency_code: string;
  subtotal_amount: string;
  tax_amount: string;
  total_amount: string;
  issued_at: string;
  sales_order_id: string | null;
}

export interface InvoiceLineRow {
  id: string;
  product_id: string;
  tax_id: string | null;
  quantity: string;
  unit_price: string;
  discount_percentage: string;
  line_total: string;
}

export interface FacturaConLineasRow extends FacturaRow {
  invoice_lines: InvoiceLineRow[];
}

export function useFacturas(params: {
  page: number;
  pageSize: number;
  branchId?: string;
  customerId?: string;
  statusId?: string;
}) {
  return useQuery({
    queryKey: ['ventas', 'facturas', 'listado', params],
    queryFn: () =>
      apiClient.get<FacturaRow[]>('/ventas/facturas', {
        params: {
          page: params.page,
          pageSize: params.pageSize,
          ...(params.branchId && { branchId: params.branchId }),
          ...(params.customerId && { customerId: params.customerId }),
          ...(params.statusId && { statusId: params.statusId }),
        },
      }),
  });
}

export function useFactura(id: string | undefined) {
  return useQuery({
    queryKey: ['ventas', 'facturas', 'detalle', id],
    queryFn: () => apiClient.get<FacturaConLineasRow>(`/ventas/facturas/${id}`),
    enabled: !!id,
  });
}
