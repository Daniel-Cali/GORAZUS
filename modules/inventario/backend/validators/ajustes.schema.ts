import { z } from 'zod';

export const crearAjusteSchema = z.object({
  warehouseId: z.string().uuid('El id de almacén debe ser un UUID válido'),
  reasonId: z.string().uuid('El id de motivo debe ser un UUID válido'),
  lines: z
    .array(
      z.object({
        productId: z.string().uuid('El id de producto debe ser un UUID válido'),
        newQuantity: z.number().nonnegative('La nueva cantidad no puede ser negativa'),
      }),
    )
    .min(1, 'Un ajuste necesita al menos una línea'),
});
export type CrearAjusteInput = z.infer<typeof crearAjusteSchema>;
