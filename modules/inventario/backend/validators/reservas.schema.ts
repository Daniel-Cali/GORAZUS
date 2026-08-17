import { z } from 'zod';

export const crearReservaSchema = z.object({
  productId: z.string().uuid('El id de producto debe ser un UUID válido'),
  warehouseId: z.string().uuid('El id de almacén debe ser un UUID válido'),
  quantity: z.number().positive('La cantidad debe ser mayor que cero'),
  sourceModule: z.string().min(1, 'sourceModule es obligatorio'),
  sourceEntityId: z.string().uuid('El id de la entidad origen debe ser un UUID válido'),
  observations: z.string().optional(),
  lotId: z.string().uuid('El id de lote debe ser un UUID válido').optional(),
  serialNumber: z.string().min(1).optional(),
});
export type CrearReservaInput = z.infer<typeof crearReservaSchema>;
