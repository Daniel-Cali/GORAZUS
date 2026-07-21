/**
 * Entidad de dominio pura (docs/architecture/02 §3). Roles de fábrica
 * (`isSystemRole`) no son eliminables ni renombrables — garantiza que una
 * empresa nunca quede sin un camino de administración válido
 * (docs/architecture/15-modulo-security.md §2).
 */
export class Rol {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly isSystemRole: boolean,
  ) {
    if (name.trim().length === 0) {
      throw new Error('El nombre del rol no puede estar vacío');
    }
  }

  verificarPuedeEliminarse(): void {
    if (this.isSystemRole) {
      throw new Error(`El rol "${this.name}" es un rol de fábrica y no puede eliminarse`);
    }
  }

  verificarPuedeRenombrarse(): void {
    if (this.isSystemRole) {
      throw new Error(`El rol "${this.name}" es un rol de fábrica y no puede renombrarse`);
    }
  }
}
