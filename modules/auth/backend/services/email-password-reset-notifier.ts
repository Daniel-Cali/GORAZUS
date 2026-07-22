import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import { PasswordResetNotifier } from './password-reset-notifier.port';

const FROM_ADDRESS = 'no-reply@gorazus.local';

/**
 * Implementación real de `PasswordResetNotifier` — SMTP vía `nodemailer`.
 * En dev, `SMTP_HOST`/`SMTP_PORT` (ya validados en `env.schema.ts`, sin
 * consumidor hasta esta sesión) apuntan a MailHog
 * (`infra/docker/docker-compose.dev.yml`), que captura el correo sin
 * enviarlo de verdad — inspeccionable en `http://localhost:8025`. En
 * producción, las mismas variables apuntan al relay SMTP real que
 * decida ops (sin TLS/auth todavía — MailHog no los soporta y no hay
 * otro proveedor confirmado; agregar `SMTP_USER`/`SMTP_PASSWORD`/`secure`
 * es un cambio de una línea cuando haga falta, no una decisión de
 * arquitectura).
 *
 * El link de reset apunta a `${CORS_ORIGIN}/reset-password` — esa página
 * de frontend todavía no existe (`apps/web` no tiene ruta de reset
 * todavía, confirmado al construir esto), pero la URL sigue la misma
 * convención de nombres que el endpoint de backend que la resuelve
 * (`POST /auth/reset-password`) y es la referencia correcta para cuando
 * esa página se construya.
 */
@Injectable()
export class EmailPasswordResetNotifier extends PasswordResetNotifier {
  private readonly transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    super();
    this.transporter = createTransport({
      host: this.configService.get<string>('mail.host'),
      port: this.configService.get<number>('mail.port'),
      secure: false,
    });
  }

  async enviarTokenReset(
    tenantSlug: string,
    email: string,
    token: string,
    expiresAt: Date,
  ): Promise<void> {
    const frontendOrigin = this.configService.get<string>('CORS_ORIGIN');
    const resetUrl = `${frontendOrigin}/reset-password?tenant=${encodeURIComponent(tenantSlug)}&token=${encodeURIComponent(token)}`;
    const expiraEn = expiresAt.toLocaleString('es');

    await this.transporter.sendMail({
      from: FROM_ADDRESS,
      to: email,
      subject: 'Restablecer tu contraseña — GORAZUS',
      text: `Recibimos una solicitud para restablecer tu contraseña.\n\nUsá este enlace (válido hasta ${expiraEn}):\n${resetUrl}\n\nSi no fuiste vos, ignorá este correo.`,
      html: `<p>Recibimos una solicitud para restablecer tu contraseña.</p><p><a href="${resetUrl}">Restablecer contraseña</a> (válido hasta ${expiraEn})</p><p>Si no fuiste vos, ignorá este correo.</p>`,
    });
  }
}
