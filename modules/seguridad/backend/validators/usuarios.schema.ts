import { z } from 'zod';

export const crearUsuarioSchema = z.object({
  email: z.string().min(1, 'El correo es obligatorio').email('Ingresá un correo válido'),
  fullName: z.string().min(1, 'El nombre es obligatorio'),
});
export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>;

export const asignarRolSchema = z.object({
  rolId: z.string().uuid('rolId debe ser un UUID válido'),
});
export type AsignarRolInput = z.infer<typeof asignarRolSchema>;

export const actualizarPerfilSchema = z.object({
  fullName: z.string().min(1, 'El nombre es obligatorio'),
});
export type ActualizarPerfilInput = z.infer<typeof actualizarPerfilSchema>;

export const cambiarPasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es obligatoria'),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
});
export type CambiarPasswordInput = z.infer<typeof cambiarPasswordSchema>;
