import { z } from 'zod';

export const crearProgramaConteoSchema = z.object({
  zoneId: z.string().uuid('El id de zona debe ser un UUID válido'),
  frequencyDays: z.number().int().positive('La frecuencia en días debe ser mayor que cero'),
  nextRunDate: z.coerce.date().optional(),
});
export type CrearProgramaConteoInput = z.infer<typeof crearProgramaConteoSchema>;

export const actualizarProgramaConteoSchema = crearProgramaConteoSchema
  .omit({ zoneId: true })
  .partial();
export type ActualizarProgramaConteoInput = z.infer<typeof actualizarProgramaConteoSchema>;
