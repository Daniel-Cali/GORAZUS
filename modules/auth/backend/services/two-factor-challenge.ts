/**
 * Contrato compartido entre `LoginUseCase` (escribe el desafío) y
 * `CompleteTwoFactorLoginUseCase` (lo lee y lo consume) — una sola función
 * para el formato de clave, mismo criterio que
 * `core/http/revoked-session-cache-key.ts`.
 */
export function twoFactorChallengeCacheKey(challengeToken: string): string {
  return `2fa-challenge:${challengeToken}`;
}

/** Ventana para completar el segundo paso (código TOTP) tras pasar la contraseña. */
export const TWO_FACTOR_CHALLENGE_TTL_SECONDS = 5 * 60;

export interface TwoFactorChallenge {
  userId: string;
  tenantId: string;
  email: string;
}
