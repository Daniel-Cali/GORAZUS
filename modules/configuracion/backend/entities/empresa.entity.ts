/**
 * Entidad de dominio pura (docs/architecture/02 §3). Valida los invariantes
 * mínimos de una empresa antes de que el repositorio la persista — el resto
 * de columnas (dirección, teléfono, etc.) son opcionales y no forman parte
 * del invariante (docs/architecture/14-modulo-core.md).
 */
export class Empresa {
  constructor(
    public readonly id: string,
    public readonly legalName: string,
    public readonly taxId: string,
    public readonly functionalCurrencyCode: string,
    public readonly fiscalYearStartMonth: number,
  ) {
    if (legalName.trim().length === 0) {
      throw new Error('La razón social de la empresa no puede estar vacía');
    }
    if (taxId.trim().length === 0) {
      throw new Error('El identificador tributario (NIT/RUC) no puede estar vacío');
    }
    if (functionalCurrencyCode.trim().length !== 3) {
      throw new Error('El código de moneda funcional debe tener 3 caracteres (ISO 4217)');
    }
    if (fiscalYearStartMonth < 1 || fiscalYearStartMonth > 12) {
      throw new Error('El mes de inicio del año fiscal debe estar entre 1 y 12');
    }
  }
}
