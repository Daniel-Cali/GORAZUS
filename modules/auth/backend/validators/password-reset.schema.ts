import { z } from 'zod';

export const forgotPasswordSchema = z.object({
  tenantSlug: z.string().min(1, 'Falta el identificador de la organización'),
  email: z.string().min(1, 'El correo es obligatorio').email('Ingresá un correo válido'),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  tenantSlug: z.string().min(1, 'Falta el identificador de la organización'),
  token: z.string().min(1, 'Falta el token de restablecimiento'),
  newPassword: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
