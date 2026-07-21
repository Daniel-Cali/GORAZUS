/**
 * Value object mínimo de dinero — solo la FORMA (Shared Kernel, ver
 * docs/architecture/06-comunicacion-entre-modulos.md §3, "Money" es
 * uno de los 3 value objects universales nombrados ahí). La
 * aritmética/redondeo por moneda ("Money Utilities",
 * docs/architecture/32-core-platform/10-utilidades-comunes.md §3) es
 * un componente propio, todavía no implementado — no se resuelve acá
 * para no mezclar la forma del dato con su motor de cálculo.
 *
 * `amount` es string decimal (nunca `number`) — evita el error clásico
 * de aritmética de punto flotante sobre dinero desde el borde mismo
 * del tipo, antes de que cualquier cálculo pueda introducirlo.
 */
export interface Money {
  amount: string;
  currency: string;
}
