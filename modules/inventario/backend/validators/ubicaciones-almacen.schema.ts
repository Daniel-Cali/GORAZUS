import { z } from 'zod';

export const crearUbicacionAlmacenSchema = z.object({
  zoneId: z.string().uuid('El id de zona debe ser un UUID válido'),
  code: z.string().min(1, 'El código de la ubicación es obligatorio'),
  parentLocationId: z.string().uuid('El id de ubicación padre debe ser un UUID válido').optional(),
});
export type CrearUbicacionAlmacenInput = z.infer<typeof crearUbicacionAlmacenSchema>;

export const actualizarUbicacionAlmacenSchema = z.object({
  code: z.string().min(1, 'El código de la ubicación es obligatorio').optional(),
});
export type ActualizarUbicacionAlmacenInput = z.infer<typeof actualizarUbicacionAlmacenSchema>;
