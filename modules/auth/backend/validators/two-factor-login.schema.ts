import { z } from 'zod';

/** Segundo paso del login con 2FA (`POST /auth/login/2fa`) — completa el desafío que devolvió `POST /auth/login` cuando el usuario tiene TOTP confirmado. */
export const twoFactorLoginSchema = z.object({
  challengeToken: z.string().min(1, 'Falta el token de desafío'),
  code: z
    .string()
    .length(6, 'El código debe tener 6 dígitos')
    .regex(/^\d{6}$/, 'El código debe ser numérico'),
});

export type TwoFactorLoginInput = z.infer<typeof twoFactorLoginSchema>;
