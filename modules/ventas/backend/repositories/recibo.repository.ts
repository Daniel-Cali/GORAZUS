import type { receipts, receipt_allocations } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

export interface CrearReciboParams {
  companyId: string;
  branchId: string;
  customerId: string;
  documentNumber: string;
  totalAmount: number;
  paymentFormId: string | null;
  invoiceId: string;
}

export type ReciboConAllocations = receipts & { receipt_allocations: receipt_allocations[] };

/**
 * `sales.receipts` + `receipt_allocations` — mismo patrón que
 * `AjusteStockRepository`/`FacturaRepository`: encabezado y allocation
 * se crean juntos. Parte 01 solo soporta un recibo por línea de pago
 * (aplicado 1:1 a la factura que lo generó) — el pago "mixto" del POS
 * se resuelve con N recibos, no con N allocations en un mismo recibo.
 */
export abstract class ReciboRepository {
  abstract crear(context: UserContext, params: CrearReciboParams): Promise<ReciboConAllocations>;

  abstract listarPorFactura(
    context: UserContext,
    invoiceId: string,
  ): Promise<ReciboConAllocations[]>;
}
