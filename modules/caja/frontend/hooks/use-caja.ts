import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@gorazus/ui-kit';

/** Fila real de `cash.cash_registers` (`CajaController.listarRegistros`). */
export interface CajaRegistroRow {
  id: string;
  company_id: string;
  branch_id: string;
  name: string;
  register_type: 'administrative' | 'pos';
}

export function useCajas(branchId: string | undefined) {
  return useQuery({
    queryKey: ['caja', 'registros', branchId],
    queryFn: () =>
      apiClient.get<CajaRegistroRow[]>('/caja/registros', {
        params: { branchId: branchId ?? undefined, page: 1, pageSize: 50 },
      }),
    enabled: !!branchId,
  });
}

export function useCrearCaja() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { companyId: string; branchId: string; name: string }) =>
      apiClient.post<CajaRegistroRow>('/caja/registros', {
        ...input,
        registerType: 'administrative',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['caja', 'registros'] });
    },
  });
}

/** Fila real de `cash.cash_register_openings` (`CajaController.obtenerAperturaActiva`). */
export interface AperturaCajaRow {
  id: string;
  register_id: string;
  opening_amount: string;
  is_open: boolean;
  opened_by_user_id: string;
  created_at: string;
}

export function useAperturaActiva(registerId: string | undefined) {
  return useQuery({
    queryKey: ['caja', 'apertura-activa', registerId],
    queryFn: () =>
      apiClient.get<AperturaCajaRow | null>(`/caja/registros/${registerId}/apertura-activa`),
    enabled: !!registerId,
    refetchInterval: 30_000,
  });
}

export function useAbrirCaja() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { registerId: string; openingAmount: number }) =>
      apiClient.post<AperturaCajaRow>('/caja/aperturas', input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['caja', 'apertura-activa', variables.registerId],
      });
    },
  });
}

/** Fila real de `cash.cash_movements` (`CajaController.listarMovimientos`, agregado en este bloque). */
export interface MovimientoCajaRow {
  id: string;
  register_id: string;
  opening_id: string;
  movement_type_id: string;
  amount: string;
  source_module: string | null;
  observations: string | null;
  created_by: string | null;
  created_at: string;
}

export function useMovimientosCaja(openingId: string | undefined) {
  return useQuery({
    queryKey: ['caja', 'movimientos', openingId],
    queryFn: () =>
      apiClient.get<MovimientoCajaRow[]>('/caja/movimientos', {
        params: { openingId: openingId ?? undefined, page: 1, pageSize: 200 },
      }),
    enabled: !!openingId,
  });
}

/** Fila real de `cash.cash_movement_types` (`CajaController.listarTiposMovimiento`, agregado en este bloque). */
export interface TipoMovimientoCajaRow {
  id: string;
  code: string;
  direction: 'in' | 'out';
}

export function useTiposMovimientoCaja() {
  return useQuery({
    queryKey: ['caja', 'tipos-movimiento'],
    queryFn: () =>
      apiClient.get<TipoMovimientoCajaRow[]>('/caja/tipos-movimiento', {
        params: { pageSize: 50 },
      }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRegistrarMovimiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      registerId: string;
      direction: 'in' | 'out';
      amount: number;
      observations?: string;
    }) => apiClient.post<MovimientoCajaRow>('/caja/movimientos', input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['caja', 'movimientos'] });
      void queryClient.invalidateQueries({
        queryKey: ['caja', 'apertura-activa', variables.registerId],
      });
    },
  });
}

/** Respuesta real de `CajaController.cerrar` — `difference_amount` es una columna generada en la base (`counted_amount - expected_amount`), nunca recalculada en el cliente. */
export interface CierreCajaResultado {
  apertura: AperturaCajaRow;
  cierre: {
    id: string;
    opening_id: string;
    expected_amount: string;
    counted_amount: string;
    difference_amount: string | null;
  };
}

export function useCerrarCaja() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { openingId: string; countedAmount: number }) =>
      apiClient.post<CierreCajaResultado>('/caja/cierres', input),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: ['caja', 'apertura-activa', data.data.apertura.register_id],
      });
      void queryClient.invalidateQueries({ queryKey: ['caja', 'movimientos'] });
    },
  });
}
