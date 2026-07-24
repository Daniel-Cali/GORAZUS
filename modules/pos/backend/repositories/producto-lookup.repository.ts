import type { UserContext } from '@gorazus/contracts';

export interface ProductoBuscado {
  id: string;
  sku: string;
  listPrice: number | null;
  baseUnitId: string;
}

/**
 * Puerto — búsqueda de productos para el buscador del POS (SKU/código de
 * barras/tipeo manual, `POS_FLOW.md` "Venta por código de barras / SKU /
 * nombre"). Copia local de solo lectura sobre `products.products`
 * (fronteras de Nx entre módulos de negocio). El catálogo de productos
 * (Fase 04) todavía no tiene una columna de nombre/descripción — la
 * grilla del POS muestra el SKU como identificador visible
 * (`POS_COMPONENTS.md`, `ProductGrid`).
 */
export abstract class ProductoLookupRepository {
  abstract existeProducto(context: UserContext, productId: string): Promise<boolean>;
  abstract buscar(context: UserContext, query: string, limit: number): Promise<ProductoBuscado[]>;
  abstract obtenerPorSku(context: UserContext, sku: string): Promise<ProductoBuscado | null>;
}
