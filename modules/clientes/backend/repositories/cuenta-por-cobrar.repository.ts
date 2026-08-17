import type { UserContext } from '@gorazus/contracts';

/** Una fila de `customers.v_accounts_receivable_aging` (vista de solo lectura, ver `sql/36_crm_customer_completion.sql §?`). */
export interface CuentaPorCobrar {
  customerId: string;
  legalName: string;
  invoiceId: string;
  documentNumber: string;
  totalAmount: string;
  openBalance: string;
  daysOutstanding: number;
  agingBucket: string;
}

/**
 * Puerto de solo lectura sobre `customers.v_accounts_receivable_aging` —
 * integración real Clientes↔Ventas↔Cuentas por Cobrar (facturas emitidas
 * por `sales`, saldo abierto calculado por la vista, no por `clientes`).
 * Sin escritura — nunca hay un `.crear()/.actualizar()` acá, la vista es
 * el único punto de verdad.
 */
export abstract class CuentaPorCobrarRepository {
  abstract listarPorCliente(context: UserContext, customerId: string): Promise<CuentaPorCobrar[]>;
}
