const FUNCIONES_ZONA = ['receiving', 'storage', 'picking', 'shipping'] as const;
export type FuncionZona = (typeof FUNCIONES_ZONA)[number];

/**
 * Entidad de dominio pura — zona funcional dentro de un almacén
 * (docs/architecture/19-modulo-inventory.md §2). `zoneFunction` es lo
 * que le da sentido operativo a la zona (recepción/almacenamiento/
 * picking/despacho), no solo organizativo — condiciona qué reglas
 * (`putaway_rules`/`picking_rules`) aplican, aunque esas reglas son de
 * la fase "Inventario" siguiente, sin código todavía.
 */
export class ZonaAlmacen {
  constructor(
    public readonly id: string,
    public readonly warehouseId: string,
    public readonly name: string,
    public readonly zoneFunction: FuncionZona,
  ) {
    if (name.trim().length === 0) {
      throw new Error('El nombre de la zona no puede estar vacío');
    }
    if (!FUNCIONES_ZONA.includes(zoneFunction)) {
      throw new Error(`Función de zona inválida: "${zoneFunction}"`);
    }
  }
}
