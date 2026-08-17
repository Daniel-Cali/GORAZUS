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
export interface ControlProducto {
  tracksLot: boolean;
  tracksSerial: boolean;
}

export abstract class ProductoLookupRepository {
  abstract existeProducto(context: UserContext, productId: string): Promise<boolean>;

  /**
   * Inventario Parte 05 Subfase 3: `products.tracks_lot`/`tracks_serial` ya
   * existen en el schema real (campo de control de producto pedido por la
   * misión — no se inventa uno nuevo). `null` si el producto no existe;
   * el llamador ya validó existencia por separado vía `existeProducto`
   * en los flujos existentes, así que este método no duplica esa excepción.
   */
  abstract obtenerControl(context: UserContext, productId: string): Promise<ControlProducto | null>;

  /** Prompt 1 (Foundation Completion): "count by product class" — ids de producto de una categoría, usado por `ProgramacionConteosService.generar()` para armar `productIds` explícitos. */
  abstract listarPorCategoria(context: UserContext, categoryId: string): Promise<string[]>;
}
