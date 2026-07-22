/**
 * Contrato compartido entre `JwtStrategy` (lee) y `LogoutUseCase` de
 * `modules/auth/backend` (escribe) — una sola función para el formato
 * de clave evita que ambos lados diverjan si el formato cambia.
 */
export function revokedSessionCacheKey(sessionId: string): string {
  return `revoked-session:${sessionId}`;
}
