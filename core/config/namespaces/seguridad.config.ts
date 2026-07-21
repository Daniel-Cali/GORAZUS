import { registerAs } from '@nestjs/config';

/** Namespace `seguridad` — cifrado de secretos 2FA (Fase 02 "preparado"). Mismo patrón que `notifications.config.ts`. */
export default registerAs('seguridad', () => ({
  encryptionKey: process.env['SEGURIDAD_ENCRYPTION_KEY'],
}));
