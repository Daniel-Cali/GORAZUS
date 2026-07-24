import type { UserContext } from '@gorazus/contracts';

/** Puerto — tasa vigente de un impuesto al calcular una línea de factura. Copia local de solo lectura sobre `taxes.tax_rates`. */
export abstract class TasaImpuestoLookupRepository {
  /** `null` si el impuesto no existe o no tiene una tasa vigente hoy. */
  abstract tasaVigente(context: UserContext, taxId: string): Promise<number | null>;
}
