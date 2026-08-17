/** Mismos helpers que `modules/ventas/frontend/components/format-id.ts`/`sales-status.ts` — duplicados localmente por la restricción de fronteras de `type:frontend`. */
export function formatId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

export function formatearMonto(amount: number | string, currencyCode: string | undefined): string {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  if (!currencyCode) return value.toFixed(2);
  try {
    return new Intl.NumberFormat('es', { style: 'currency', currency: currencyCode }).format(value);
  } catch {
    return `${currencyCode} ${value.toFixed(2)}`;
  }
}
