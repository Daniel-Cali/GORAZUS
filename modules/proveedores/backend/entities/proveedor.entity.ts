/**
 * Entidad de dominio pura — maestro único de proveedores
 * (`docs/database/logico/04-suppliers.md`: "purchases/banks lo
 * referencian por ID, nunca lo duplican"). Alcance de esta parte: el
 * proveedor base y su estado de bloqueo — contactos, direcciones,
 * cuentas bancarias, crédito, evaluaciones, clasificación y contratos
 * quedan para una parte siguiente (mismo criterio "una tabla a la vez"
 * ya usado en `productos`).
 */
export class Proveedor {
  constructor(
    public readonly id: string,
    public readonly legalName: string,
    public readonly taxId: string,
    public readonly paymentTermsDays: number,
    public readonly isBlocked: boolean,
  ) {
    if (legalName.trim().length === 0) {
      throw new Error('La razón social del proveedor no puede estar vacía');
    }
    if (taxId.trim().length === 0) {
      throw new Error('El RNC/identificación fiscal del proveedor no puede estar vacío');
    }
    if (paymentTermsDays < 0) {
      throw new Error('Los días de plazo de pago no pueden ser negativos');
    }
  }
}
