/**
 * Entidad de dominio pura sobre `inventory.inventory_lots` — Inventario
 * Parte 05, Subfase 3 (Lotes y Series). Un lote pertenece a un único
 * producto y agrupa una cantidad (`remaining_quantity`), nunca representa
 * una unidad física individual (a diferencia de `SerieInventario`). El
 * schema real no tiene columna de estado — el estado ("disponible"/
 * "agotado"/"vencido") se deriva en el servicio a partir de
 * `remainingQuantity` y `expiryDate`, mismo patrón que el estado derivado
 * de Recepciones/Salidas (ISSUE-25).
 */
export class LoteInventario {
  constructor(
    public readonly productId: string,
    public readonly lotNumber: string,
    public readonly quantity: number,
    public readonly expiryDate: Date | null,
    public readonly manufactureDate: Date | null,
    public readonly supplierReference: string | null,
  ) {
    if (lotNumber.trim().length === 0) {
      throw new Error('El número de lote no puede estar vacío');
    }
    if (quantity <= 0) {
      throw new Error('La cantidad del lote debe ser mayor que cero');
    }
    if (expiryDate !== null && manufactureDate !== null && expiryDate < manufactureDate) {
      throw new Error('La fecha de vencimiento no puede ser anterior a la fecha de fabricación');
    }
  }
}
