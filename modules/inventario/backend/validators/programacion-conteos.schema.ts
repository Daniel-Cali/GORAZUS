import { z } from 'zod';

export const crearProgramaConteoSchema = z.object({
  zoneId: z.string().uuid('El id de zona debe ser un UUID válido'),
  frequencyDays: z.number().int().positive('La frecuencia en días debe ser mayor que cero'),
  nextRunDate: z.coerce.date().optional(),
  /** Prompt 1 (Foundation Completion): granularidad más fina que zoneId — opcional. */
  locationId: z.string().uuid('El id de ubicación debe ser un UUID válido').optional(),
  /** Prompt 1 (Foundation Completion): "by product class" — cross-schema hacia products.product_categories. */
  productCategoryId: z.string().uuid('El id de categoría debe ser un UUID válido').optional(),
});
export type CrearProgramaConteoInput = z.infer<typeof crearProgramaConteoSchema>;

export const actualizarProgramaConteoSchema = crearProgramaConteoSchema
  .omit({ zoneId: true })
  .partial();
export type ActualizarProgramaConteoInput = z.infer<typeof actualizarProgramaConteoSchema>;
