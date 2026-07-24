import { z } from 'zod';

export const crearMotivoAjusteSchema = z.object({
  name: z.string().min(1, 'El nombre del motivo es obligatorio'),
});
export type CrearMotivoAjusteInput = z.infer<typeof crearMotivoAjusteSchema>;

export const actualizarMotivoAjusteSchema = crearMotivoAjusteSchema.partial();
export type ActualizarMotivoAjusteInput = z.infer<typeof actualizarMotivoAjusteSchema>;
