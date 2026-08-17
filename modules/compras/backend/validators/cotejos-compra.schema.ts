import { z } from 'zod';

export const ejecutarCotejoCompraSchema = z.object({
  purchaseOrderId: z.string().uuid('El id de orden de compra debe ser un UUID válido'),
  receiptNoteId: z.string().uuid('El id de recepción de compra debe ser un UUID válido'),
  purchaseInvoiceId: z.string().uuid('El id de factura de compra debe ser un UUID válido'),
});
export type EjecutarCotejoCompraInput = z.infer<typeof ejecutarCotejoCompraSchema>;
