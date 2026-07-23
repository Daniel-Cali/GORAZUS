import { registerAs } from '@nestjs/config';

/**
 * Namespace `auth` — ver core/config/namespaces/database.config.ts (mismo
 * patrón) y docs/architecture/13-modulo-auth.md.
 *
 * FASE 03 Parte 02: `accessTokenTtl`/`refreshTokenTtlDays`/
 * `loginLockoutThreshold`/`loginLockoutWindowMinutes`/
 * `twoFactorChallengeTtlMinutes` (expuestos desde Parte 2.1) ya tienen
 * consumidor real — `login.usecase.ts`, `refresh-token.usecase.ts`,
 * `issue-login-session.service.ts`. `rememberMeTtlDays` y
 * `strictSessionValidation` son nuevos de esta parte.
 */
export default registerAs('auth', () => ({
  jwtAccessSecret: process.env['JWT_ACCESS_SECRET'],
  jwtRefreshSecret: process.env['JWT_REFRESH_SECRET'],
  accessTokenTtl: process.env['JWT_ACCESS_TTL'] ?? '15m',
  refreshTokenTtlDays: Number(process.env['JWT_REFRESH_TTL_DAYS'] ?? 7),
  rememberMeTtlDays: Number(process.env['JWT_REMEMBER_ME_TTL_DAYS'] ?? 30),
  loginLockoutThreshold: Number(process.env['LOGIN_LOCKOUT_THRESHOLD'] ?? 5),
  loginLockoutWindowMinutes: Number(process.env['LOGIN_LOCKOUT_WINDOW_MINUTES'] ?? 15),
  twoFactorChallengeTtlMinutes: Number(process.env['TWO_FACTOR_CHALLENGE_TTL_MINUTES'] ?? 5),
  strictSessionValidation: process.env['AUTH_STRICT_SESSION_VALIDATION'] === 'true',
}));
