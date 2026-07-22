/**
 * Lectura mínima sobre `security.two_factor_credentials` — puerto propio de
 * `auth` (no reusa `CredencialDosFactoresRepository` de `modules/seguridad`:
 * `auth` no puede depender de otro módulo de negocio, ver eslint
 * `@nx/enforce-module-boundaries`/`depConstraints` en `eslint.config.mjs`).
 * Mismo criterio ya usado para `login-attempt.repository.ts`: ambos módulos
 * leen el mismo cliente Prisma `security` (`core/database`, infraestructura
 * compartida), cada uno con su propio repositorio de aplicación.
 */
export interface TwoFactorCredential {
  encryptedSecret: string;
}

export abstract class TwoFactorCredentialRepository {
  /** `null` si no tiene 2FA activo — sin confirmar no cuenta (setup pendiente, ver `modules/seguridad/backend/services/dos-factores.service.ts`). */
  abstract findConfirmedByUserId(
    tenantId: string,
    userId: string,
  ): Promise<TwoFactorCredential | null>;
}
