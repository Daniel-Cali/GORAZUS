import { z } from 'zod';

const lineaRecepcionCompraSchema = z.object({
  productId: z.string().uuid('El id de producto debe ser un UUID válido'),
  quantity: z.number().positive('La cantidad recibida debe ser mayor que cero'),
});

export const crearRecepcionCompraSchema = z.object({
  purchaseOrderId: z.string().uuid('El id de orden de compra debe ser un UUID válido'),
  lines: z.array(lineaRecepcionCompraSchema).min(1, 'La recepción debe tener al menos una línea'),
  /** ISSUE-07: opcional para no romper clientes existentes — sin ella, no hay protección de idempotencia. */
  idempotencyKey: z.string().min(1).max(255).optional(),
});
export type CrearRecepcionCompraInput = z.input<typeof crearRecepcionCompraSchema>;

/** Editar — nunca reasigna la orden de compra, solo líneas (y solo mientras sigue activa). */
export const actualizarRecepcionCompraSchema = z.object({
  lines: z.array(lineaRecepcionCompraSchema).min(1, 'La recepción debe tener al menos una línea'),
});
export type ActualizarRecepcionCompraInput = z.input<typeof actualizarRecepcionCompraSchema>;
