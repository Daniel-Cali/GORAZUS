const TIPOS_GASTO_IMPORTACION = ['freight', 'insurance', 'customs', 'other'] as const;
export type TipoGastoImportacion = (typeof TIPOS_GASTO_IMPORTACION)[number];

/**
 * Entidad de dominio pura sobre `purchases.import_expenses` — gasto
 * asociado a un expediente de importación, prorrateable al costo.
 * `expenseType` refleja el `CHECK` real de la tabla
 * (`08_purchases.sql`), no una convención inventada.
 */
export class GastoImportacion {
  constructor(
    public readonly id: string,
    public readonly importId: string,
    public readonly expenseType: TipoGastoImportacion,
    public readonly amount: number,
  ) {
    if (importId.trim().length === 0) {
      throw new Error('El gasto requiere un expediente de importación');
    }
    if (!TIPOS_GASTO_IMPORTACION.includes(expenseType)) {
      throw new Error(`Tipo de gasto de importación inválido: "${expenseType}"`);
    }
    if (amount <= 0) {
      throw new Error('El monto del gasto debe ser mayor que cero');
    }
  }
}
