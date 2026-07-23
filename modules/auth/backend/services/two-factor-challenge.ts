/**
 * Contrato compartido entre `LoginUseCase` (escribe el desafío) y
 * `CompleteTwoFactorLoginUseCase` (lo lee y lo consume) — una sola función
 * para el formato de clave, mismo criterio que
 * `core/http/revoked-session-cache-key.ts`.
 */
export function twoFactorChallengeCacheKey(challengeToken: string): string {
  return `2fa-challenge:${challengeToken}`;
}

export interface TwoFactorChallenge {
  userId: string;
  tenantId: string;
  email: string;
  /** IP/User-Agent del primer paso (contraseña) — se propagan al segundo paso para que la sesión emitida los guarde igual que un login sin 2FA. */
  ipAddress: string | null;
  userAgent: string | null;
  /** "Recordar sesión" pedido en el primer paso — se aplica recién al emitir la sesión, en el segundo paso. */
  rememberMe: boolean;
}
