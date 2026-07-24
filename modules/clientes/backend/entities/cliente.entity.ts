/**
 * Entidad de dominio pura (docs/architecture/02 §3) — mismo criterio que
 * `Almacen`/`Sucursal`. `customers.customers` tiene 17 columnas propias
 * en el schema completo (`docs/database/sql/03_customers.sql`); Parte 01
 * de POS (`POS_ARCHITECTURE.md §3`) solo construye las que un checkout
 * de mostrador necesita — el resto (perfil de crédito, clasificación,
 * rutas de venta, visitas) queda diseñado, sin código.
 */
export class Cliente {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly branchId: string | null,
    public readonly legalName: string,
    public readonly taxId: string,
    public readonly preferredCurrencyCode: string,
    public readonly isBlocked: boolean = false,
  ) {
    if (legalName.trim().length === 0) {
      throw new Error('El nombre del cliente no puede estar vacío');
    }
    if (taxId.trim().length === 0) {
      throw new Error('El identificador fiscal del cliente no puede estar vacío');
    }
    if (!/^[A-Z]{3}$/.test(preferredCurrencyCode)) {
      throw new Error('El código de moneda debe tener 3 letras mayúsculas (ISO 4217)');
    }
  }
}

/**
 * `tax_id` reservado para el cliente sentinela por empresa — nunca lo
 * elige un usuario a mano (`uq_customers_customers_taxid` en
 * `(company_id, tax_id)` ya lo protege de colisión con un cliente real).
 */
export const TAX_ID_CONSUMIDOR_FINAL = 'CF';
