import { z } from 'zod';

export const crearMarcaSchema = z.object({
  companyId: z.string().uuid('El id de empresa debe ser un UUID válido'),
  name: z.string().min(1, 'El nombre de la marca es obligatorio'),
});
export type CrearMarcaInput = z.infer<typeof crearMarcaSchema>;

export const actualizarMarcaSchema = crearMarcaSchema.omit({ companyId: true }).partial();
export type ActualizarMarcaInput = z.infer<typeof actualizarMarcaSchema>;
