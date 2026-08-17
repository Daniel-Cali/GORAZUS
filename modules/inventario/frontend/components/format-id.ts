/**
 * `inventory.stock`/`stock_movements` no desnormalizan nombre/SKU de
 * producto (cross-schema hacia `products`, sin relación Prisma — mismo
 * límite documentado en el backend toda la sesión). Mostrar el UUID crudo
 * es honesto; lo truncamos con estilo monoespaciado (patrón común de ERP
 * para referencias internas) en vez de inventar un nombre falso. Ver
 * "Known limitations" del informe — requiere un lookup batch de productos
 * para mostrar SKU/nombre real.
 */
export function formatId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}
