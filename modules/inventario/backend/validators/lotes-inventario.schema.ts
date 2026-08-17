import { z } from 'zod';

export const listarLotesQuerySchema = z.object({
  productId: z.string().uuid('El id de producto debe ser un UUID válido').optional(),
  warehouseId: z.string().uuid('El id de almacén debe ser un UUID válido').optional(),
});
export type ListarLotesQuery = z.infer<typeof listarLotesQuerySchema>;

export const proximosAVencerQuerySchema = z.object({
  dias: z.coerce.number().int().positive('Los días deben ser un entero positivo').default(30),
});
export type ProximosAVencerQuery = z.infer<typeof proximosAVencerQuerySchema>;
