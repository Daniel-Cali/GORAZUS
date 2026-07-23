import { z } from 'zod';

export const crearModeloProductoSchema = z.object({
  companyId: z.string().uuid('El id de empresa debe ser un UUID válido'),
  brandId: z.string().uuid('El id de marca debe ser un UUID válido'),
  name: z.string().min(1, 'El nombre del modelo es obligatorio'),
});
export type CrearModeloProductoInput = z.infer<typeof crearModeloProductoSchema>;

export const actualizarModeloProductoSchema = z.object({
  name: z.string().min(1, 'El nombre del modelo es obligatorio').optional(),
});
export type ActualizarModeloProductoInput = z.infer<typeof actualizarModeloProductoSchema>;
