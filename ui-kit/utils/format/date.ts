/** Envuelve `Intl.DateTimeFormat` (docs/architecture/32-core-platform/10-utilidades-comunes.md §3) — ningún módulo formatea fechas a mano. */
export function formatDate(
  date: Date,
  locale = 'es',
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(
    locale,
    options ?? { day: '2-digit', month: '2-digit', year: 'numeric' },
  ).format(date);
}

export function formatDateTime(date: Date, locale = 'es'): string {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatRelativeToNow(date: Date, locale = 'es'): string {
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60_000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, 'minute');
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');
  const diffDays = Math.round(diffHours / 24);
  return rtf.format(diffDays, 'day');
}
