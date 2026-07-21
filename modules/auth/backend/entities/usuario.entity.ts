const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Entidad de dominio pura — sin Prisma/Nest (docs/architecture/02 §3).
 * `auth` no es dueño de la tabla `core.users` (docs/architecture/13-modulo-auth.md
 * §0 — excepción de propiedad de datos), pero sí es dueño del invariante
 * "qué es un email válido" y "cómo se verifica una contraseña" a nivel de dominio.
 */
export class Usuario {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly email: string,
    public readonly passwordHash: string | null,
    public readonly fullName: string,
    public readonly isActive: boolean,
  ) {
    if (!EMAIL_PATTERN.test(email)) {
      throw new Error(`Email inválido: ${email}`);
    }
  }

  puedeAutenticarse(): boolean {
    return this.isActive && this.passwordHash !== null;
  }
}
