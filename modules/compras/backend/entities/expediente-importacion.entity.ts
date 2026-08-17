/**
 * Entidad de dominio pura sobre `purchases.imports` — Compras FASE 11
 * (Imports). Agrupa una Orden de Compra al exterior + sus gastos
 * (`import_expenses`, agregados incrementalmente, no fijados al crear).
 * A diferencia de la mayoría de los aggregates de Compras, sí tiene
 * flujo de estados en el schema real (`import_status`), aunque su
 * catálogo no lleva `is_final`.
 */
export class ExpedienteImportacion {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly purchaseOrderId: string,
  ) {
    if (purchaseOrderId.trim().length === 0) {
      throw new Error('El expediente de importación requiere una orden de compra');
    }
  }
}
