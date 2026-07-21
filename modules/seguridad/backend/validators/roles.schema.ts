import { z } from 'zod';

export const crearRolSchema = z.object({
  name: z.string().min(1, 'El nombre del rol es obligatorio'),
});
export type CrearRolInput = z.infer<typeof crearRolSchema>;

export const asignarPermisoSchema = z.object({
  permissionCode: z.string().min(1, 'El código de permiso es obligatorio'),
});
export type AsignarPermisoInput = z.infer<typeof asignarPermisoSchema>;
