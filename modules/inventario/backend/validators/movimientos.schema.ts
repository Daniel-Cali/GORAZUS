import { z } from 'zod';

export const registrarMovimientoSchema = z
  .object({
    productId: z.string().uuid('El id de producto debe ser un UUID válido'),
    warehouseId: z.string().uuid('El id de almacén debe ser un UUID válido'),
    locationId: z.string().uuid('El id de ubicación debe ser un UUID válido').optional(),
    movementTypeId: z.string().uuid('El id de tipo de movimiento debe ser un UUID válido'),
    quantity: z.number().positive('La cantidad debe ser mayor que cero'),
    unitCost: z.number().nonnegative('El costo unitario no puede ser negativo').optional(),
    sourceModule: z.string().min(1).optional(),
    sourceEntityId: z
      .string()
      .uuid('El id de la entidad origen debe ser un UUID válido')
      .optional(),
    observations: z.string().optional(),
    /** ISSUE-07: opcional para no romper clientes existentes — sin ella, no hay protección de idempotencia. */
    idempotencyKey: z.string().min(1).max(255).optional(),
    /** Inventario Parte 05 Subfase 3: lote/serie de origen o destino — opcionales, solo aplican a productos con `tracks_lot`/`tracks_serial`. */
    lotId: z.string().uuid('El id de lote debe ser un UUID válido').optional(),
    serialId: z.string().uuid('El id de serie debe ser un UUID válido').optional(),
  })
  .refine((data) => Boolean(data.sourceModule) === Boolean(data.sourceEntityId), {
    message: 'sourceModule y sourceEntityId deben indicarse juntos, o ninguno de los dos',
    path: ['sourceEntityId'],
  });
export type RegistrarMovimientoInput = z.infer<typeof registrarMovimientoSchema>;
