/**
 * Listar facturas/cotizaciones/pedidos no incluye el nombre del cliente
 * (`sales.invoices`/`quotes`/`sales_orders` solo traen `customer_id`, sin
 * relación Prisma incluida en `listar()` — mismo límite documentado en
 * `modules/ventas/backend/repositories/factura.repository.ts`). Mostrar el
 * UUID truncado es honesto; el nombre real sí se resuelve en el detalle
 * (`GET /clientes/:id`, un solo lookup, no N+1 sobre la tabla).
 */
export function formatId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}
