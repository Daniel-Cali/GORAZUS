/**
 * Entidad de dominio pura (docs/architecture/02 §3) — unidad de medida
 * (unidad, caja, kg, litro...), prerequisito de `Producto` (`base_unit_id`
 * es `NOT NULL` en `products.products` — docs/architecture/18-modulo-products.md §1).
 */
export class UnidadMedida {
  constructor(
    public readonly id: string,
    public readonly code: string,
  ) {
    if (code.trim().length === 0) {
      throw new Error('El código de la unidad de medida no puede estar vacío');
    }
  }
}
