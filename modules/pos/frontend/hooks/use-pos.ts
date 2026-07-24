import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@gorazus/ui-kit';

export interface EmpresaRecord {
  id: string;
  legal_name: string;
}

export interface SucursalRecord {
  id: string;
  name: string;
}

export interface AlmacenRecord {
  id: string;
  name: string;
}

export interface CajaRegistroRecord {
  id: string;
  name: string;
  register_type: 'administrative' | 'pos';
}

export interface AperturaCajaRecord {
  id: string;
  register_id: string;
  opening_amount: string;
  is_open: boolean;
}

export interface ProductoPosRecord {
  id: string;
  sku: string;
  listPrice: number | null;
  baseUnitId: string;
}

export interface LineaVentaPos {
  productId: string;
  warehouseId: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discountPercentage: number;
}

export interface FacturaPosRecord {
  id: string;
  document_number: string;
  subtotal_amount: string;
  tax_amount: string;
  total_amount: string;
}

/** Empresas activas — usadas por el selector de contexto del POS (`POS_ARCHITECTURE.md §3`, sin switcher global todavía). */
export function useEmpresas() {
  return useQuery({
    queryKey: ['pos', 'empresas'],
    queryFn: () =>
      apiClient.get<EmpresaRecord[]>('/configuracion/empresas', {
        params: { page: 1, pageSize: 50 },
      }),
  });
}

export function useSucursales(companyId: string | null) {
  return useQuery({
    queryKey: ['pos', 'sucursales', companyId],
    queryFn: () =>
      apiClient.get<SucursalRecord[]>('/configuracion/sucursales', {
        params: { companyId: companyId ?? undefined, page: 1, pageSize: 50 },
      }),
    enabled: Boolean(companyId),
  });
}

export function useCajas(branchId: string | null) {
  return useQuery({
    queryKey: ['pos', 'cajas', branchId],
    queryFn: () =>
      apiClient.get<CajaRegistroRecord[]>('/caja/registros', {
        params: { branchId: branchId ?? undefined, page: 1, pageSize: 50 },
      }),
    enabled: Boolean(branchId),
  });
}

/** Almacén de la sucursal — el POS usa el primero de la lista, un solo almacén por sucursal para Parte 01 (`POS_ARCHITECTURE.md §3`). */
export function useAlmacenes(branchId: string | null) {
  return useQuery({
    queryKey: ['pos', 'almacenes', branchId],
    queryFn: () =>
      apiClient.get<AlmacenRecord[]>('/inventario/almacenes', {
        params: { branchId: branchId ?? undefined, page: 1, pageSize: 50 },
      }),
    enabled: Boolean(branchId),
  });
}

export function useCrearCaja() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { companyId: string; branchId: string; name: string }) =>
      apiClient.post<CajaRegistroRecord>('/caja/registros', {
        ...input,
        registerType: 'pos',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['pos', 'cajas'] });
    },
  });
}

export function useAperturaActiva(registerId: string | null) {
  return useQuery({
    queryKey: ['pos', 'apertura-activa', registerId],
    queryFn: () =>
      apiClient.get<AperturaCajaRecord | null>(`/caja/registros/${registerId}/apertura-activa`),
    enabled: Boolean(registerId),
    refetchInterval: 30_000,
  });
}

export function useAbrirCaja() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { registerId: string; openingAmount: number }) =>
      apiClient.post<AperturaCajaRecord>('/caja/aperturas', input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['pos', 'apertura-activa', variables.registerId],
      });
    },
  });
}

export function useCerrarCaja() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { openingId: string; countedAmount: number }) =>
      apiClient.post('/caja/cierres', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['pos', 'apertura-activa'] });
    },
  });
}

/** `useMutation`, no una búsqueda reactiva por tecla — el buscador dispara la búsqueda explícitamente al Enter/scan (`POS_COMPONENTS.md`, `BarcodeScannerInput`). */
export function useBuscarProductos() {
  return useMutation({
    mutationFn: (query: string) =>
      apiClient.get<ProductoPosRecord[]>('/pos/productos', { params: { query } }),
  });
}

export interface ConfirmarVentaPayload {
  companyId: string;
  branchId: string;
  registerId: string;
  customerId?: string;
  currencyCode: string;
  lines: Array<{
    productId: string;
    warehouseId: string;
    quantity: number;
    unitPrice: number;
    discountPercentage: number;
  }>;
  payments: Array<{ paymentFormId?: string; amount: number }>;
}

export function useConfirmarVenta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ConfirmarVentaPayload) =>
      apiClient.post<{ factura: FacturaPosRecord; cambio: number }>('/pos/ventas', payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['pos', 'apertura-activa'] });
    },
  });
}

export function useSuspenderVenta() {
  return useMutation({
    mutationFn: (payload: Omit<ConfirmarVentaPayload, 'payments'>) =>
      apiClient.post<FacturaPosRecord>('/pos/ventas/suspender', payload),
  });
}

export function useVentasSuspendidas(branchId: string | null) {
  return useQuery({
    queryKey: ['pos', 'suspendidas', branchId],
    queryFn: () =>
      apiClient.get<FacturaPosRecord[]>('/pos/ventas/suspendidas', {
        params: { branchId: branchId ?? undefined },
      }),
    enabled: Boolean(branchId),
  });
}
