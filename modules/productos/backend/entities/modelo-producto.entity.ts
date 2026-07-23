/**
 * Entidad de dominio pura — modelo dentro de una marca. `brandId` es
 * obligatorio: un modelo siempre pertenece a una marca, no existe
 * "modelo sin marca" (docs/architecture/18-modulo-products.md §4).
 */
export class ModeloProducto {
  constructor(
    public readonly id: string,
    public readonly brandId: string,
    public readonly name: string,
  ) {
    if (name.trim().length === 0) {
      throw new Error('El nombre del modelo no puede estar vacío');
    }
  }
}
