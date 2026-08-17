import type { UserContext } from '@gorazus/contracts';

/** Puerto — verificación de solo lectura de `products.products`. Copia local propia de `crm` (fronteras de Nx), análoga a la de `modules/ventas/backend`. */
export abstract class ProductoLookupRepository {
  abstract existeProducto(context: UserContext, productId: string): Promise<boolean>;
}
