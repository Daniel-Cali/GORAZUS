import { z } from 'zod';

export const crearUnidadMedidaSchema = z.object({
  companyId: z.string().uuid('El id de empresa debe ser un UUID válido'),
  code: z.string().min(1, 'El código de la unidad es obligatorio'),
});
export type CrearUnidadMedidaInput = z.infer<typeof crearUnidadMedidaSchema>;

export const actualizarUnidadMedidaSchema = crearUnidadMedidaSchema
  .omit({ companyId: true })
  .partial();
export type ActualizarUnidadMedidaInput = z.infer<typeof actualizarUnidadMedidaSchema>;
