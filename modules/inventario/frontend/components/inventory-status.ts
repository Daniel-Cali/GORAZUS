import { CHART_STATUS_COLORS } from '@gorazus/ui-kit';

/**
 * "GORAZUS Operational Intelligence" — vocabulario de estado compartido por
 * todos los componentes de Inventario. Reutiliza los 4 tokens semánticos ya
 * certificados en `ui-kit` (good/warning/serious/critical) en vez de definir
 * una paleta paralela — el sistema de diseño es compartido entre módulos
 * (`ui-kit` "sin conocimiento de negocio"), Inventario solo lo interpreta.
 */
export type NivelEstado = 'good' | 'warning' | 'serious' | 'critical' | 'neutral';

export const ESTADO_COLOR: Record<NivelEstado, string> = {
  good: CHART_STATUS_COLORS.good,
  warning: CHART_STATUS_COLORS.warning,
  serious: CHART_STATUS_COLORS.serious,
  critical: CHART_STATUS_COLORS.critical,
  neutral: 'var(--muted-foreground)',
};

export type TipoMovimiento =
  | 'receipt'
  | 'issue'
  | 'transfer_in'
  | 'transfer_out'
  | 'adjustment_increase'
  | 'adjustment_decrease'
  | 'production_output'
  | 'production_consumption';

export interface MovimientoVisual {
  etiqueta: string;
  nivel: NivelEstado;
}

/** Código real de `stock_movement_types.code` (seed) → etiqueta en español + nivel semántico. */
export const MOVIMIENTO_VISUAL: Record<TipoMovimiento, MovimientoVisual> = {
  receipt: { etiqueta: 'Entrada', nivel: 'good' },
  issue: { etiqueta: 'Salida', nivel: 'neutral' },
  transfer_in: { etiqueta: 'Transferencia (entrada)', nivel: 'good' },
  transfer_out: { etiqueta: 'Transferencia (salida)', nivel: 'neutral' },
  adjustment_increase: { etiqueta: 'Ajuste (+)', nivel: 'good' },
  adjustment_decrease: { etiqueta: 'Ajuste (-)', nivel: 'warning' },
  production_output: { etiqueta: 'Producción', nivel: 'good' },
  production_consumption: { etiqueta: 'Consumo producción', nivel: 'neutral' },
};

export function resolverMovimientoVisual(code: string): MovimientoVisual {
  return MOVIMIENTO_VISUAL[code as TipoMovimiento] ?? { etiqueta: code, nivel: 'neutral' };
}

/** Salud de una fila de stock — regla pura: sin mínimo configurado no hay veredicto ("neutral"), nunca se inventa un umbral. */
export function resolverSaludStock(params: {
  quantityOnHand: number;
  quantityReserved: number;
  minQuantity?: number | null;
  maxQuantity?: number | null;
}): { nivel: NivelEstado; etiqueta: string } {
  const disponible = params.quantityOnHand - params.quantityReserved;
  if (disponible <= 0) return { nivel: 'critical', etiqueta: 'Sin disponibilidad' };
  if (params.minQuantity != null && disponible < params.minQuantity) {
    return { nivel: 'warning', etiqueta: 'Bajo mínimo' };
  }
  if (params.maxQuantity != null && params.quantityOnHand > params.maxQuantity) {
    return { nivel: 'serious', etiqueta: 'Sobre stock' };
  }
  return { nivel: 'good', etiqueta: 'Saludable' };
}

/** Vencimiento de un lote — umbral de "por vencer" fijo en 30 días, mismo criterio que `LotesInventarioController.proximosAVencer` (backend). */
export function resolverVencimientoLote(expiryDate: string | Date | null): {
  nivel: NivelEstado;
  etiqueta: string;
} | null {
  if (!expiryDate) return null;
  const hoy = new Date();
  const vence = new Date(expiryDate);
  const diasRestantes = Math.ceil((vence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  if (diasRestantes < 0) return { nivel: 'critical', etiqueta: 'Vencido' };
  if (diasRestantes <= 30) return { nivel: 'warning', etiqueta: `Vence en ${diasRestantes} días` };
  return { nivel: 'good', etiqueta: 'Vigente' };
}
