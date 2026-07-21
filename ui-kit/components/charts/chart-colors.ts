/**
 * Orden categórico FIJO — nunca ciclado, nunca reordenado por filtro (skill
 * de dataviz, references/color-formula.md: "color sigue a la entidad, nunca
 * a su rango"). Validado contra los pisos de daltonismo/contraste
 * (`references/palette.md`) — más de 4 series en un gráfico de dispersión/
 * burbuja/choropleth requiere "Other"/facetado, nunca una 9na serie
 * generada. Los valores son variables CSS (`apps/web/src/styles/globals.css`)
 * para que claro/oscuro cambien sin tocar este archivo.
 */
export const CHART_SERIES_COLORS = [
  'var(--chart-series-1)',
  'var(--chart-series-2)',
  'var(--chart-series-3)',
  'var(--chart-series-4)',
  'var(--chart-series-5)',
  'var(--chart-series-6)',
  'var(--chart-series-7)',
  'var(--chart-series-8)',
] as const;

/** Reservados — nunca reusados como "serie 4" (dataviz skill, non-negotiables). Siempre con ícono + texto, nunca solo color. */
export const CHART_STATUS_COLORS = {
  good: 'var(--chart-status-good)',
  warning: 'var(--chart-status-warning)',
  serious: 'var(--chart-status-serious)',
  critical: 'var(--chart-status-critical)',
} as const;

export const CHART_INK = {
  primary: 'var(--chart-ink-primary)',
  secondary: 'var(--chart-ink-secondary)',
  muted: 'var(--chart-ink-muted)',
  gridline: 'var(--chart-gridline)',
  baseline: 'var(--chart-baseline)',
} as const;

export function seriesColor(index: number): string {
  return CHART_SERIES_COLORS[index % CHART_SERIES_COLORS.length]!;
}
