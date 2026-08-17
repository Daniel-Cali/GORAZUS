import { z } from 'zod';

export const crearContactoSchema = z.object({
  fullName: z.string().min(1, 'El nombre del contacto es obligatorio'),
  jobTitle: z.string().optional(),
  email: z.string().email('El email no es válido').optional(),
  phone: z.string().optional(),
  isPrimary: z.boolean().default(false),
});
export type CrearContactoInput = z.infer<typeof crearContactoSchema>;

export const actualizarContactoSchema = crearContactoSchema.partial();
export type ActualizarContactoInput = z.infer<typeof actualizarContactoSchema>;
