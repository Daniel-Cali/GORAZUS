/**
 * Entidad de dominio pura sobre `inventory.stock_adjustment_reasons` —
 * catálogo configurable de motivos de ajuste (`docs/database/sql/06_inventory.sql`
 * — solo `name`, sin columnas propias adicionales). Igual que
 * `TipoMovimientoStock` (Parte 02): agregar un motivo nuevo es una fila,
 * no una migración — los "motivos mínimos" pedidos (Daño, Pérdida,
 * Robo...) se siembran vía `scripts/seed-stock-adjustment-reasons.ts`,
 * no están codificados como enum en ningún lado.
 */
export class MotivoAjuste {
  constructor(
    public readonly id: string,
    public readonly name: string,
  ) {
    if (name.trim().length === 0) {
      throw new Error('El nombre del motivo de ajuste no puede estar vacío');
    }
  }
}
