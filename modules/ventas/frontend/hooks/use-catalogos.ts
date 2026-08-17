import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@gorazus/ui-kit';

/** Fila real de `sales.invoice_status`/`quote_status`/`sales_order_status` — solo `code` importa para la UI, el resto son campos de auditoría del catálogo. */
export interface EstadoVentaRow {
  id: string;
  code: string;
  is_final?: boolean;
}

export function useEstadosFactura() {
  return useQuery({
    queryKey: ['ventas', 'facturas', 'estados'],
    queryFn: () =>
      apiClient.get<EstadoVentaRow[]>('/ventas/facturas/estados', { params: { pageSize: 50 } }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useEstadosCotizacion() {
  return useQuery({
    queryKey: ['ventas', 'cotizaciones', 'estados'],
    queryFn: () =>
      apiClient.get<EstadoVentaRow[]>('/ventas/cotizaciones/estados', { params: { pageSize: 50 } }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useEstadosPedido() {
  return useQuery({
    queryKey: ['ventas', 'pedidos', 'estados'],
    queryFn: () =>
      apiClient.get<EstadoVentaRow[]>('/ventas/pedidos/estados', { params: { pageSize: 50 } }),
    staleTime: 5 * 60 * 1000,
  });
}

/** Mapa `id → code`, para resolver `status_id` (crudo en las filas de listado) a un código de catálogo interpretable por `sales-status.ts`. */
export function mapaEstadoPorId(estados: EstadoVentaRow[] | undefined): Record<string, string> {
  if (!estados) return {};
  return Object.fromEntries(estados.map((e) => [e.id, e.code]));
}
