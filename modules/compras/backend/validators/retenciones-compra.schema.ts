import { z } from 'zod';

export const crearRetencionCompraSchema = z.object({
  purchaseInvoiceId: z.string().uuid('El id de factura de compra debe ser un UUID válido'),
  withholdingRuleId: z
    .string()
    .uuid('El id de regla de retención debe ser un UUID válido')
    .optional(),
  amount: z.number().positive('El monto de la retención debe ser mayor que cero'),
});
export type CrearRetencionCompraInput = z.infer<typeof crearRetencionCompraSchema>;

/** Editar — nunca reasigna la factura de compra. */
export const actualizarRetencionCompraSchema = z.object({
  withholdingRuleId: z
    .string()
    .uuid('El id de regla de retención debe ser un UUID válido')
    .optional(),
  amount: z.number().positive('El monto de la retención debe ser mayor que cero'),
});
export type ActualizarRetencionCompraInput = z.infer<typeof actualizarRetencionCompraSchema>;
