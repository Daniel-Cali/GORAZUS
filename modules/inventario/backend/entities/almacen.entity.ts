const TIPOS_ALMACEN = ['physical', 'virtual'] as const;
export type TipoAlmacen = (typeof TIPOS_ALMACEN)[number];

/**
 * Entidad de dominio pura (docs/architecture/02 §3) — mismo criterio que
 * `Sucursal` (`modules/configuracion/backend`). Un almacén pertenece
 * siempre a una empresa y una sucursal concretas (ambas `NOT NULL` en
 * `inventory.warehouses`, a diferencia de la mayoría de tablas de
 * negocio) — docs/architecture/19-modulo-inventory.md §1: "un almacén
 * siempre pertenece a una sucursal concreta". La validación de que esa
 * empresa/sucursal existan de verdad requiere consultar otras tablas,
 * fuera del alcance de una entidad de dominio pura — eso vive en
 * `AlmacenesService`.
 */
export class Almacen {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly branchId: string,
    public readonly name: string,
    public readonly code: string,
    public readonly warehouseType: TipoAlmacen,
  ) {
    if (name.trim().length === 0) {
      throw new Error('El nombre del almacén no puede estar vacío');
    }
    if (code.trim().length === 0) {
      throw new Error('El código del almacén no puede estar vacío');
    }
    if (!TIPOS_ALMACEN.includes(warehouseType)) {
      throw new Error(`Tipo de almacén inválido: "${warehouseType}"`);
    }
  }
}
