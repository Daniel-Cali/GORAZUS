/** Métodos soportados — mismo CHECK que `security.two_factor_credentials.method` (docs/database/sql/02_security.sql). Solo `totp` implementado; `sms`/`email` quedan reservados para cuando exista el canal de entrega correspondiente. */
export const METODOS_DOS_FACTORES = ['totp', 'sms', 'email'] as const;
export type MetodoDosFactores = (typeof METODOS_DOS_FACTORES)[number];

/**
 * Entidad de dominio pura (docs/architecture/02 §3). 2FA "preparado"
 * (Fase 02) — el mecanismo (generar secreto, confirmar código, deshabilitar)
 * es real y funcional; lo que queda pendiente es integrarlo como paso
 * obligatorio de `LoginUseCase` (Fase 2, mismo criterio que
 * `docs/architecture/13-modulo-auth.md §2` ya documenta para la rama 2FA).
 */
export class CredencialDosFactores {
  constructor(
    public readonly id: string,
    public readonly method: string,
    public readonly confirmedAt: Date | null,
  ) {
    if (!METODOS_DOS_FACTORES.includes(method as MetodoDosFactores)) {
      throw new Error(
        `El método "${method}" no es válido — debe ser uno de: ${METODOS_DOS_FACTORES.join(', ')}`,
      );
    }
  }

  verificarNoConfirmada(): void {
    if (this.confirmedAt) {
      throw new Error('Esta credencial de doble autenticación ya fue confirmada');
    }
  }

  verificarConfirmada(): void {
    if (!this.confirmedAt) {
      throw new Error('Esta credencial de doble autenticación todavía no fue confirmada');
    }
  }
}
