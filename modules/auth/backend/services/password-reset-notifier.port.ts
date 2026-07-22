/**
 * Puerto de entrega del token de restablecimiento de contraseña
 * (docs/architecture/02 §3, DIP). Implementación real:
 * `EmailPasswordResetNotifier` (SMTP vía `nodemailer`, apunta a MailHog en
 * dev — ver `.env.example` SMTP_HOST/SMTP_PORT, ya validados en
 * `env.schema.ts` desde antes de esta sesión pero sin ningún consumidor
 * hasta ahora). `LoggingPasswordResetNotifier` queda como implementación
 * de respaldo/test (deja el token en el log estructurado, nunca en la
 * respuesta HTTP), no la registrada por defecto en `auth.module.ts`.
 */
export abstract class PasswordResetNotifier {
  abstract enviarTokenReset(
    tenantSlug: string,
    email: string,
    token: string,
    expiresAt: Date,
  ): Promise<void>;
}
