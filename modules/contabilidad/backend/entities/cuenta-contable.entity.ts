/** Convención real del plan de cuentas: código numérico o jerárquico simple (`1105`, `1.1.05`), sin espacios. */
const PATRON_CODIGO_CUENTA = /^[A-Za-z0-9.-]+$/;

/**
 * Entidad de dominio pura sobre `accounting.chart_of_accounts` — valida
 * invariantes de forma (código/nombre), no invariantes que requieren
 * consultar la base (unicidad del código, jerarquía real de padres),
 * esas las aplica `PlanCuentasService`.
 */
export class CuentaContable {
  constructor(
    public readonly code: string,
    public readonly name: string,
    public readonly accountTypeId: string,
    public readonly acceptsPostings: boolean,
    public readonly parentAccountId: string | null,
  ) {
    if (!code.trim()) {
      throw new Error('El código de la cuenta no puede estar vacío');
    }
    if (!PATRON_CODIGO_CUENTA.test(code)) {
      throw new Error('El código de la cuenta solo puede tener letras, números, puntos y guiones');
    }
    if (!name.trim()) {
      throw new Error('El nombre de la cuenta no puede estar vacío');
    }
  }
}
