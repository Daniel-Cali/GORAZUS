/**
 * Puerto de entrega del token de restablecimiento de contraseña
 * (docs/architecture/02 §3, DIP). `core/notifications` (Notification
 * Center) hoy solo tiene el canal WhatsApp implementado (Fase 1) — no
 * existe todavía un canal de email para enviar el enlace de reset por
 * correo, que es el medio real esperado en producción. Hasta que ese
 * canal exista, `LoggingPasswordResetNotifier` es la única implementación:
 * deja el token en el log estructurado (nunca en la respuesta HTTP, ver
 * `forgot-password.usecase.ts`) para que un operador pueda entregarlo
 * manualmente en desarrollo. Reemplazar esta implementación por una real
 * (email) es trabajo de una fase futura, registrado en ROADMAP.md.
 */
export abstract class PasswordResetNotifier {
  abstract enviarTokenReset(email: string, token: string, expiresAt: Date): Promise<void>;
}
