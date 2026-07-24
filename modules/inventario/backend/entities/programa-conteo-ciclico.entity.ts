/**
 * Entidad de dominio pura sobre `inventory.cycle_count_schedules` —
 * calendario de conteo cíclico recurrente por zona
 * (`INVENTORY_CYCLE_COUNT.md §2`). `frequency_days` es un entero
 * genérico (no un enum Diario/Semanal/Mensual/...) — cualquiera de los
 * períodos pedidos se expresa como cantidad de días: diario=1,
 * semanal=7, quincenal=15, mensual=30, trimestral=90, semestral=180,
 * anual=365. Sin clasificación ABC/rotación/categoría/proveedor — el
 * schema no tiene esas columnas, ver `INVENTORY_CYCLE_COUNT.md §4`.
 */
export class ProgramaConteoCiclico {
  constructor(
    public readonly id: string,
    public readonly zoneId: string,
    public readonly frequencyDays: number,
  ) {
    if (frequencyDays <= 0) {
      throw new Error('La frecuencia en días debe ser mayor que cero');
    }
  }
}
