import { registerAs } from '@nestjs/config';

/**
 * Namespace `auth` — ver core/config/namespaces/database.config.ts (mismo
 * patrón) y docs/architecture/13-modulo-auth.md.
 */
export default registerAs('auth', () => ({
  jwtAccessSecret: process.env['JWT_ACCESS_SECRET'],
  jwtRefreshSecret: process.env['JWT_REFRESH_SECRET'],
}));
