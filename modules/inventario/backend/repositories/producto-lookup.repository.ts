import type { UserContext } from '@gorazus/contracts';

/**
 * Puerto — verificación de producto al registrar un movimiento de stock
 * (`inventory.stock.product_id`/`stock_movements.product_id` son FK a
 * `products.products`, `NOT NULL`). `inventario` no es dueño de
 * `products.products` — la adapta igual que `EmpresaLookupRepository`
 * de `modules/productos/backend` adapta `core.companies`, cada módulo
 * con su propio repositorio sobre el cliente compartido que necesita
 * (`@nx/enforce-module-boundaries` impide importar
 * `modules/productos/backend` directo).
 */
export abstract class ProductoLookupRepository {
  abstract existeProducto(context: UserContext, productId: string): Promise<boolean>;
}
