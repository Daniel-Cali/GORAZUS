import { CHART_STATUS_COLORS } from '@gorazus/ui-kit';

/**
 * Vocabulario de estado de Ventas — reutiliza los 4 tokens semánticos de
 * `ui-kit` (good/warning/serious/critical), mismo criterio que
 * `modules/inventario/frontend/components/inventory-status.ts`. Los
 * códigos vienen de los catálogos reales `sales.invoice_status` /
 * `sales.quote_status` / `sales.sales_order_status` (consultados vía
 * `GET /ventas/{facturas,cotizaciones,pedidos}/estados`) — no hay forma
 * de adivinarlos, cada tabla trae su propio set de códigos sembrados.
 */
export type NivelEstado = 'good' | 'warning' | 'serious' | 'critical' | 'neutral';

export const ESTADO_COLOR: Record<NivelEstado, string> = {
  good: CHART_STATUS_COLORS.good,
  warning: CHART_STATUS_COLORS.warning,
  serious: CHART_STATUS_COLORS.serious,
  critical: CHART_STATUS_COLORS.critical,
  neutral: 'var(--muted-foreground)',
};

export interface EstadoVisual {
  etiqueta: string;
  nivel: NivelEstado;
}

/** `sales.invoice_status.code` → etiqueta en español + nivel semántico. */
export const ESTADO_FACTURA_VISUAL: Record<string, EstadoVisual> = {
  draft: { etiqueta: 'Borrador', nivel: 'neutral' },
  confirmed: { etiqueta: 'Confirmada', nivel: 'warning' },
  issued: { etiqueta: 'Emitida', nivel: 'good' },
  partially_paid: { etiqueta: 'Pago parcial', nivel: 'warning' },
  paid: { etiqueta: 'Pagada', nivel: 'good' },
  voided: { etiqueta: 'Anulada', nivel: 'critical' },
  cancelled: { etiqueta: 'Cancelada', nivel: 'critical' },
};

/** `sales.quote_status.code` → etiqueta en español + nivel semántico. */
export const ESTADO_COTIZACION_VISUAL: Record<string, EstadoVisual> = {
  draft: { etiqueta: 'Borrador', nivel: 'neutral' },
  sent: { etiqueta: 'Enviada', nivel: 'warning' },
  approved: { etiqueta: 'Aprobada', nivel: 'good' },
  accepted: { etiqueta: 'Aceptada', nivel: 'good' },
  converted: { etiqueta: 'Convertida a pedido', nivel: 'good' },
  expired: { etiqueta: 'Vencida', nivel: 'critical' },
  rejected: { etiqueta: 'Rechazada', nivel: 'critical' },
};

/** `sales.sales_order_status.code` → etiqueta en español + nivel semántico. */
export const ESTADO_PEDIDO_VISUAL: Record<string, EstadoVisual> = {
  draft: { etiqueta: 'Borrador', nivel: 'neutral' },
  pending: { etiqueta: 'Pendiente', nivel: 'warning' },
  reserved: { etiqueta: 'Reservado', nivel: 'warning' },
  confirmed: { etiqueta: 'Confirmado', nivel: 'good' },
  partial: { etiqueta: 'Facturado parcial', nivel: 'warning' },
  delivered: { etiqueta: 'Entregado', nivel: 'good' },
  completed: { etiqueta: 'Completado', nivel: 'good' },
  invoiced: { etiqueta: 'Facturado', nivel: 'good' },
  cancelled: { etiqueta: 'Cancelado', nivel: 'critical' },
};

export function resolverEstadoVisual(
  catalogo: Record<string, EstadoVisual>,
  code: string | undefined,
): EstadoVisual {
  if (!code) return { etiqueta: 'Sin estado', nivel: 'neutral' };
  return catalogo[code] ?? { etiqueta: code, nivel: 'neutral' };
}

/** Formatea un monto monetario — la moneda es siempre la de la línea/documento (`currency_code`), nunca asumida. */
export function formatearMonto(amount: number | string, currencyCode: string): string {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  return new Intl.NumberFormat('es', { style: 'currency', currency: currencyCode }).format(value);
}
