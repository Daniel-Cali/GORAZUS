/** Envuelve `Intl.NumberFormat` (docs/architecture/32-core-platform/10-utilidades-comunes.md §3). */
export function formatNumber(
  value: number,
  locale = 'es',
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatPercent(value: number, locale = 'es', maximumFractionDigits = 1): string {
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits }).format(value);
}
