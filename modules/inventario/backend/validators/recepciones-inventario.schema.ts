import { z } from 'zod';

/** Inventario Parte 05 Subfase 3: datos de lote/serie por línea — solo obligatorios si el producto tiene `tracks_lot`/`tracks_serial` (validado en el servicio, no aquí — el schema no conoce el producto). */
const lineaRecepcionInventarioSchema = z.object({
  productId: z.string().uuid('El id de producto debe ser un UUID válido'),
  quantity: z.number().positive('La cantidad debe ser mayor que cero'),
  unitCost: z.number().nonnegative('El costo unitario no puede ser negativo').optional(),
  lotNumber: z.string().min(1, 'El número de lote no puede estar vacío').optional(),
  expiryDate: z.coerce.date().optional(),
  manufactureDate: z.coerce.date().optional(),
  supplierReference: z.string().min(1).optional(),
  serialNumbers: z.array(z.string().min(1, 'El número de serie no puede estar vacío')).optional(),
});

export const crearRecepcionInventarioSchema = z
  .object({
    warehouseId: z.string().uuid('El id de almacén debe ser un UUID válido'),
    lines: z
      .array(lineaRecepcionInventarioSchema)
      .min(1, 'La recepción debe tener al menos una línea'),
    sourceModule: z.string().min(1).optional(),
    sourceEntityId: z
      .string()
      .uuid('El id de la entidad origen debe ser un UUID válido')
      .optional(),
  })
  .refine((data) => Boolean(data.sourceModule) === Boolean(data.sourceEntityId), {
    message: 'sourceModule y sourceEntityId deben indicarse juntos, o ninguno de los dos',
    path: ['sourceEntityId'],
  });
export type CrearRecepcionInventarioInput = z.infer<typeof crearRecepcionInventarioSchema>;

/** ISSUE-07: opcional para no romper clientes existentes — reutiliza `inventory.movement_idempotency_keys` vía `MovimientosService`. */
export const confirmarRecepcionInventarioSchema = z.object({
  idempotencyKey: z.string().min(1).max(255).optional(),
});
export type ConfirmarRecepcionInventarioInput = z.infer<typeof confirmarRecepcionInventarioSchema>;
