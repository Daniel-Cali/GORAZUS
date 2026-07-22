/**
 * `security.login_attempts` (docs/database/sql/02_security.sql) — puerto
 * mínimo, no extiende `BaseRepository`: esta tabla es solo
 * append-only + un conteo por ventana de tiempo, no un CRUD paginado
 * como el resto de repositorios (docs/architecture/02 §3 exige el
 * patrón repositorio, no una forma concreta única).
 */
export interface LoginAttemptRecord {
  tenantId: string;
  emailAttempted: string;
  userId: string | null;
  ipAddress: string | null;
  succeeded: boolean;
}

export abstract class LoginAttemptRepository {
  /** Cuenta intentos fallidos de este email dentro de esta tenant desde `since` — usado para el bloqueo por intentos (`login.usecase.ts`). */
  abstract countRecentFailures(
    tenantId: string,
    emailAttempted: string,
    since: Date,
  ): Promise<number>;

  abstract record(attempt: LoginAttemptRecord): Promise<void>;
}
