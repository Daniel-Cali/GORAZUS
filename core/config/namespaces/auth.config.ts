import { registerAs } from '@nestjs/config';

/**
 * Namespace `auth` — ver core/config/namespaces/database.config.ts (mismo
 * patrón) y docs/architecture/13-modulo-auth.md.
 *
 * `accessTokenTtl`/`refreshTokenTtlDays`/`loginLockoutThreshold`/
 * `loginLockoutWindowMinutes`/`twoFactorChallengeTtlMinutes` — expuestos
 * acá (Parte 2.1) pero todavía sin consumidor: los use cases de login
 * (Parte 2 — Backend Core) siguen con sus propias constantes hardcodeadas
 * con el mismo valor por default. Conectarlos es trabajo de Parte 2.2, sin
 * tocar el login todavía.
 */
export default registerAs('auth', () => ({
  jwtAccessSecret: process.env['JWT_ACCESS_SECRET'],
  jwtRefreshSecret: process.env['JWT_REFRESH_SECRET'],
  accessTokenTtl: process.env['JWT_ACCESS_TTL'] ?? '15m',
  refreshTokenTtlDays: Number(process.env['JWT_REFRESH_TTL_DAYS'] ?? 7),
  loginLockoutThreshold: Number(process.env['LOGIN_LOCKOUT_THRESHOLD'] ?? 5),
  loginLockoutWindowMinutes: Number(process.env['LOGIN_LOCKOUT_WINDOW_MINUTES'] ?? 15),
  twoFactorChallengeTtlMinutes: Number(process.env['TWO_FACTOR_CHALLENGE_TTL_MINUTES'] ?? 5),
}));
