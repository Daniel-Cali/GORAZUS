import type { UserContext } from '@gorazus/contracts';

/** Puerto — verificación de producto al crear una línea de factura. Copia local de solo lectura, mismo motivo que `modules/inventario/backend/repositories/producto-lookup.repository.ts` (fronteras de Nx entre módulos de negocio). */
export abstract class ProductoLookupRepository {
  abstract existeProducto(context: UserContext, productId: string): Promise<boolean>;
}
