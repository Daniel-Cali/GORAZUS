import { z } from 'zod';

/**
 * `sessionId` opcional: presente revoca solo esa sesión, ausente revoca
 * todas las del usuario ("cerrar sesión en todos los dispositivos"). El
 * objeto completo también es opcional — un `POST /auth/revoke` sin body
 * (caso más común: "cerrame todo") no manda `Content-Type: application/
 * json` con `{}`, puede no mandar body en absoluto.
 */
export const revokeTokenSchema = z
  .object({
    sessionId: z.string().uuid('sessionId debe ser un UUID válido').optional(),
  })
  .optional()
  .default({});
export type RevokeTokenInput = z.infer<typeof revokeTokenSchema>;
