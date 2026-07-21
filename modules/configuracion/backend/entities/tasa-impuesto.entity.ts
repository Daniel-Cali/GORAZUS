/**
 * Entidad de dominio pura (docs/architecture/02 §3). Tasa vigente de un
 * impuesto (`taxes.tax_rates`) — `effectiveTo` nulo significa "vigente
 * indefinidamente"; la validación de solapamiento entre tasas del mismo
 * impuesto queda fuera del alcance mínimo de Fase 02.
 */
export class TasaImpuesto {
  constructor(
    public readonly id: string,
    public readonly taxId: string,
    public readonly ratePercentage: number,
    public readonly effectiveFrom: Date,
  ) {
    if (ratePercentage < 0 || ratePercentage > 100) {
      throw new Error('El porcentaje de la tasa debe estar entre 0 y 100');
    }
  }
}
