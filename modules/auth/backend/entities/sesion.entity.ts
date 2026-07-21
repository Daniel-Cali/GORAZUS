/**
 * Ver docs/architecture/13-modulo-auth.md §9: dos temporalidades
 * distintas — acá solo se modela la expiración absoluta del refresh
 * token (`core.sessions.expires_at`/`revoked_at`); el idle-timeout vía
 * Redis es Fase 2 (no implementado todavía).
 */
export class Sesion {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly refreshTokenHash: string,
    public readonly expiresAt: Date,
    public readonly revokedAt: Date | null,
  ) {}

  estaVigente(ahora: Date): boolean {
    return this.revokedAt === null && this.expiresAt > ahora;
  }

  /** Valida que la transición sea legal — quien llama persiste el nuevo `revokedAt` vía el repositorio (entidad inmutable, no se muta a sí misma). */
  verificarPuedeRevocarse(): void {
    if (this.revokedAt !== null) {
      throw new Error('La sesión ya estaba revocada');
    }
  }
}
