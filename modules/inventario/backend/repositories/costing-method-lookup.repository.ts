import type { UserContext } from '@gorazus/contracts';

/**
 * Puerto — lee `products.products.costing_method` (`String NOT NULL
 * DEFAULT 'average'`, sin `CHECK` a nivel de BD — `ADR-INV-004 §12.3`
 * documenta que la validación de valores permitidos vive en la capa de
 * aplicación). Mismo criterio que `ProductoLookupRepository`: `inventario`
 * no es dueño de `products.products`, lo adapta con su propio puerto
 * sobre el cliente compartido (`@nx/enforce-module-boundaries` impide
 * importar `modules/productos/backend` directo).
 */
export abstract class CostingMethodLookupRepository {
  /** `null` si el producto no existe — quien llama decide cómo traducirlo (`CosteoService` lo trata como producto inválido). */
  abstract obtenerMetodoDeCosteo(context: UserContext, productId: string): Promise<string | null>;
}
