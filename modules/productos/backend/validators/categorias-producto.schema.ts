import { z } from 'zod';

export const crearCategoriaProductoSchema = z.object({
  companyId: z.string().uuid('El id de empresa debe ser un UUID válido'),
  code: z.string().min(1, 'El código de la categoría es obligatorio'),
  parentCategoryId: z.string().uuid('El id de categoría padre debe ser un UUID válido').optional(),
});
export type CrearCategoriaProductoInput = z.infer<typeof crearCategoriaProductoSchema>;

export const actualizarCategoriaProductoSchema = z.object({
  code: z.string().min(1, 'El código de la categoría es obligatorio').optional(),
});
export type ActualizarCategoriaProductoInput = z.infer<typeof actualizarCategoriaProductoSchema>;
