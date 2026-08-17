/**
 * Entidad de dominio pura sobre `inventory.inventory_serials` — Inventario
 * Parte 05, Subfase 3 (Lotes y Series). Una serie representa exactamente UNA
 * unidad física (a diferencia de `LoteInventario`, que agrupa cantidad) —
 * por eso no tiene campo `quantity`: cada serie es, por definición, 1.
 * `status` ("in_stock"/"issued") sí es una columna real en el schema
 * (a diferencia de lotes/recepciones/salidas), pero esta entidad valida
 * solo la identidad al crearse — las transiciones de estado las gobierna
 * el repositorio/servicio, no el constructor.
 */
export class SerieInventario {
  constructor(
    public readonly productId: string,
    public readonly serialNumber: string,
  ) {
    if (serialNumber.trim().length === 0) {
      throw new Error('El número de serie no puede estar vacío');
    }
  }
}
