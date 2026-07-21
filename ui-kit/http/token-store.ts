/**
 * Access token en memoria, nunca en localStorage/sessionStorage — reduce
 * superficie de ataque XSS frente a robo de token (docs/frontend/API_LAYER.md
 * §4). Se pierde a un refresh de página a propósito: `initSession()` (que
 * cada app consumidora llama al montar) lo re-deriva pidiendo un refresh
 * contra la cookie httpOnly.
 */
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}
