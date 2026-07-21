/**
 * Entidad de dominio pura (docs/architecture/02 §3). El código ISO 4217
 * (3 letras) es el identificador de negocio de una moneda — mismo
 * invariante que `Empresa.functionalCurrencyCode`.
 */
export class Moneda {
  constructor(
    public readonly id: string,
    public readonly isoCode: string,
    public readonly decimalPlaces: number,
  ) {
    if (isoCode.trim().length !== 3) {
      throw new Error('El código ISO de la moneda debe tener 3 caracteres (ISO 4217)');
    }
    if (decimalPlaces < 0 || decimalPlaces > 6) {
      throw new Error('La cantidad de decimales de la moneda debe estar entre 0 y 6');
    }
  }
}
