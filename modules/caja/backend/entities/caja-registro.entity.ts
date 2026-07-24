const TIPOS_CAJA = ['administrative', 'pos'] as const;
export type TipoCaja = (typeof TIPOS_CAJA)[number];

/** Entidad de dominio pura sobre `cash.cash_registers` (`POS_ARCHITECTURE.md §3`). */
export class CajaRegistro {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly branchId: string,
    public readonly name: string,
    public readonly registerType: TipoCaja,
  ) {
    if (name.trim().length === 0) {
      throw new Error('El nombre de la caja no puede estar vacío');
    }
    if (!TIPOS_CAJA.includes(registerType)) {
      throw new Error(`Tipo de caja inválido: "${registerType}"`);
    }
  }
}
