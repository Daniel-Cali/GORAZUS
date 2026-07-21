/**
 * Entidad de dominio pura (docs/architecture/02 §3). Gestión administrativa
 * de sesiones (`core.sessions`) — distinta del flujo de login/refresh que
 * ya vive en `modules/auth/backend/repositories/session.repository.ts`
 * (ese repositorio resuelve sesiones DURANTE la autenticación; este módulo
 * las expone/revoca DESPUÉS, desde una vista administrativa).
 */
export class Sesion {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly revokedAt: Date | null,
  ) {}

  verificarPuedeRevocarse(): void {
    if (this.revokedAt) {
      throw new Error('La sesión ya fue revocada');
    }
  }
}
