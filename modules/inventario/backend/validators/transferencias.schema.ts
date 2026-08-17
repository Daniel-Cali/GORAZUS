import { z } from 'zod';

export const crearTransferenciaSchema = z.object({
  sourceWarehouseId: z.string().uuid('El id de almacén de origen debe ser un UUID válido'),
  destinationWarehouseId: z.string().uuid('El id de almacén de destino debe ser un UUID válido'),
  documentNumber: z.string().min(1, 'El número de documento es obligatorio'),
  lines: z
    .array(
      z.object({
        productId: z.string().uuid('El id de producto debe ser un UUID válido'),
        quantity: z.number().positive('La cantidad debe ser mayor que cero'),
        lotId: z.string().uuid('El id de lote debe ser un UUID válido').optional(),
        serialNumbers: z.array(z.string().min(1)).optional(),
      }),
    )
    .min(1, 'Una transferencia necesita al menos una línea'),
});
export type CrearTransferenciaInput = z.infer<typeof crearTransferenciaSchema>;
