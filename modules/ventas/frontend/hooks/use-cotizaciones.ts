import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, useAppStore } from '@gorazus/ui-kit';

/** Fila real de `sales.quotes` (`CotizacionesController.listar`). */
export interface CotizacionRow {
  id: string;
  document_number: string;
  customer_id: string;
  branch_id: string;
  status_id: string;
  currency_code: string;
  total_amount: string;
  valid_until: string | null;
  created_at: string;
}

/** `companyId` es obligatorio en este endpoint (a diferencia de Facturas) — se resuelve de la sesión activa, nunca hardcodeado. */
export function useCotizaciones(params: {
  page: number;
  pageSize: number;
  branchId?: string;
  customerId?: string;
  statusId?: string;
}) {
  const companyId = useAppStore((s) => s.activeCompanyId);
  return useQuery({
    queryKey: ['ventas', 'cotizaciones', 'listado', companyId, params],
    queryFn: () =>
      apiClient.get<CotizacionRow[]>('/ventas/cotizaciones', {
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

export interface QuoteLineRow {
  id: string;
  product_id: string;
  quantity: string;
  unit_price: string;
  discount_percentage: string;
}

export interface CotizacionConLineasRow extends CotizacionRow {
  quote_lines: QuoteLineRow[];
}

export function useCotizacion(id: string | undefined) {
  return useQuery({
    queryKey: ['ventas', 'cotizaciones', 'detalle', id],
    queryFn: () => apiClient.get<CotizacionConLineasRow>(`/ventas/cotizaciones/${id}`),
    enabled: !!id,
  });
}

function invalidarListadoYDetalle(
  queryClient: ReturnType<typeof useQueryClient>,
  id?: string,
): void {
  void queryClient.invalidateQueries({ queryKey: ['ventas', 'cotizaciones', 'listado'] });
  if (id) {
    void queryClient.invalidateQueries({ queryKey: ['ventas', 'cotizaciones', 'detalle', id] });
  }
}

export interface LineaCotizacionInput {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPercentage?: number;
}

/** Mismo body que `crearCotizacionSchema` (backend) — companyId/branchId se resuelven de la sesión activa, nunca hardcodeados. */
export interface CrearCotizacionPayload {
  companyId: string;
  branchId: string;
  customerId: string;
  salespersonId?: string;
  currencyCode: string;
  validUntil?: string;
  lines: LineaCotizacionInput[];
}

export function useCrearCotizacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CrearCotizacionPayload) =>
      apiClient.post<CotizacionConLineasRow>('/ventas/cotizaciones', payload),
    onSuccess: () => invalidarListadoYDetalle(queryClient),
  });
}

/** Mismo body que `actualizarCotizacionSchema` (backend) — nunca reasigna empresa/sucursal/cliente/moneda, solo el propio backend puede editar mientras siga en `draft` (409 si no). */
export interface ActualizarCotizacionPayload {
  salespersonId?: string;
  validUntil?: string;
  lines: LineaCotizacionInput[];
}

export function useActualizarCotizacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; payload: ActualizarCotizacionPayload }) =>
      apiClient.put<CotizacionConLineasRow>(`/ventas/cotizaciones/${params.id}`, params.payload),
    onSuccess: (_data, variables) => invalidarListadoYDetalle(queryClient, variables.id),
  });
}

/** Baja lógica — el backend rechaza con 409 si la cotización ya no está en `draft` (mismo motivo que editar). */
export function useEliminarCotizacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<CotizacionRow>(`/ventas/cotizaciones/${id}`),
    onSuccess: (_data, id) => invalidarListadoYDetalle(queryClient, id),
  });
}

export function useAprobarCotizacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post<CotizacionRow>(`/ventas/cotizaciones/${id}/aprobar`),
    onSuccess: (_data, id) => invalidarListadoYDetalle(queryClient, id),
  });
}

/** El backend no acepta motivo de rechazo (`CotizacionesController.rechazar` no toma body) — no se inventa un campo que la API no soporta. */
export function useRechazarCotizacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<CotizacionRow>(`/ventas/cotizaciones/${id}/rechazar`),
    onSuccess: (_data, id) => invalidarListadoYDetalle(queryClient, id),
  });
}

/** Crea un borrador nuevo con las mismas líneas (`CotizacionesService.duplicar`) — nunca clona el objeto en el cliente. */
export function useDuplicarCotizacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<CotizacionConLineasRow>(`/ventas/cotizaciones/${id}/duplicar`),
    onSuccess: () => invalidarListadoYDetalle(queryClient),
  });
}

/**
 * Convierte una cotización `approved` y vigente en un Pedido de venta real
 * (`POST /ventas/pedidos/desde-cotizacion/:id?warehouseId=`) — el flujo real
 * es Cotización → Pedido → Factura, NO Cotización → Factura directo; no
 * existe (ni se inventa acá) un endpoint que salte el Pedido.
 */
export function useConvertirCotizacionAPedido() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { cotizacionId: string; warehouseId: string }) =>
      apiClient.post<{ id: string; document_number: string }>(
        `/ventas/pedidos/desde-cotizacion/${params.cotizacionId}`,
        undefined,
        { params: { warehouseId: params.warehouseId } },
      ),
    onSuccess: (_data, variables) => {
      invalidarListadoYDetalle(queryClient, variables.cotizacionId);
      void queryClient.invalidateQueries({ queryKey: ['ventas', 'pedidos'] });
    },
  });
}
