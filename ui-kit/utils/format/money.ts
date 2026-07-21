import type { Money } from '@gorazus/contracts';

/**
 * Envuelve `Intl.NumberFormat` estilo `currency` (docs/architecture/
 * 32-core-platform/10-utilidades-comunes.md §3, "Money Utilities" —
 * la aritmética/redondeo real vive en el backend; esto es solo
 * presentación). `Money.amount` es string decimal — se convierte a
 * number únicamente para formatear, nunca para calcular.
 */
export function formatMoney(money: Money, locale = 'es'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: money.currency }).format(
    Number(money.amount),
  );
}

/** Para inputs controlados: formatea un número crudo sin símbolo de moneda propio (el símbolo lo agrega el `MoneyInput` como prefijo visual). */
export function formatDecimal(value: number, locale = 'es', minimumFractionDigits = 2): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits: minimumFractionDigits,
  }).format(value);
}
