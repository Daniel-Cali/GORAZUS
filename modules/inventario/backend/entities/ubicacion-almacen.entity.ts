/**
 * Entidad de dominio pura — ubicación jerárquica dentro de una zona
 * (docs/architecture/19-modulo-inventory.md §2: "Almacén → Zona →
 * Ubicación", esta última auto-referenciada vía `parentLocationId` para
 * representar pasillo→estante→bin sin fijar una profundidad rígida,
 * mismo patrón que `product_categories`). Validar que `parentLocationId`
 * pertenezca a la misma zona (si viene informado) requiere consultar
 * otras filas — fuera del alcance de una entidad de dominio pura, vive
 * en `UbicacionesAlmacenService`.
 */
export class UbicacionAlmacen {
  constructor(
    public readonly id: string,
    public readonly zoneId: string,
    public readonly code: string,
    public readonly parentLocationId: string | null,
  ) {
    if (code.trim().length === 0) {
      throw new Error('El código de la ubicación no puede estar vacío');
    }
    if (parentLocationId === id) {
      throw new Error('Una ubicación no puede ser su propia ubicación padre');
    }
  }
}
