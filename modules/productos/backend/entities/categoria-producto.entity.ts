/**
 * Entidad de dominio pura — categoría jerárquica auto-referenciada de N
 * niveles (`parent_category_id`, docs/architecture/18-modulo-products.md
 * §2) — mismo patrón que `UbicacionAlmacen` en `modules/inventario/backend`.
 */
export class CategoriaProducto {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly parentCategoryId: string | null,
  ) {
    if (code.trim().length === 0) {
      throw new Error('El código de la categoría no puede estar vacío');
    }
    if (parentCategoryId === id) {
      throw new Error('Una categoría no puede ser su propia categoría padre');
    }
  }
}
