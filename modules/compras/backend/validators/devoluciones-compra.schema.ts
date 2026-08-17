import { z } from 'zod';

const lineaDevolucionCompraSchema = z.object({
  productId: z.string().uuid('El id de producto debe ser un UUID válido'),
  quantity: z.number().positive('La cantidad devuelta debe ser mayor que cero'),
});

export const crearDevolucionCompraSchema = z.object({
  purchaseInvoiceId: z.string().uuid('El id de factura de compra debe ser un UUID válido'),
  reason: z.string().optional(),
  lines: z.array(lineaDevolucionCompraSchema).min(1, 'La devolución debe tener al menos una línea'),
});
export type CrearDevolucionCompraInput = z.input<typeof crearDevolucionCompraSchema>;

/** Editar — nunca reasigna la factura de compra, solo líneas (y solo mientras sigue activa). */
export const actualizarDevolucionCompraSchema = z.object({
  lines: z.array(lineaDevolucionCompraSchema).min(1, 'La devolución debe tener al menos una línea'),
});
export type ActualizarDevolucionCompraInput = z.input<typeof actualizarDevolucionCompraSchema>;
