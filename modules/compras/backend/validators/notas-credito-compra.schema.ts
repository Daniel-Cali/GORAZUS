import { z } from 'zod';

const lineaNotaCreditoCompraSchema = z.object({
  productId: z.string().uuid('El id de producto debe ser un UUID válido'),
  quantity: z.number().positive('La cantidad debe ser mayor que cero'),
});

export const crearNotaCreditoCompraSchema = z.object({
  purchaseInvoiceId: z.string().uuid('El id de factura de compra debe ser un UUID válido'),
  lines: z
    .array(lineaNotaCreditoCompraSchema)
    .min(1, 'La nota de crédito debe tener al menos una línea'),
});
export type CrearNotaCreditoCompraInput = z.input<typeof crearNotaCreditoCompraSchema>;

/** Editar — nunca reasigna la factura de compra, solo líneas (y solo mientras sigue activa); el monto se recalcula server-side. */
export const actualizarNotaCreditoCompraSchema = z.object({
  lines: z
    .array(lineaNotaCreditoCompraSchema)
    .min(1, 'La nota de crédito debe tener al menos una línea'),
});
export type ActualizarNotaCreditoCompraInput = z.input<typeof actualizarNotaCreditoCompraSchema>;
