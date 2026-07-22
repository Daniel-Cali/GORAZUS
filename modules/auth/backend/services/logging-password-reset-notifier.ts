import { Injectable } from '@nestjs/common';
import { LoggerService } from '@gorazus/core-logging';
import { PasswordResetNotifier } from './password-reset-notifier.port';

/** Implementación temporal de `PasswordResetNotifier` — ver comentario de cabecera del puerto. */
@Injectable()
export class LoggingPasswordResetNotifier extends PasswordResetNotifier {
  constructor(private readonly logger: LoggerService) {
    super();
  }

  async enviarTokenReset(
    tenantSlug: string,
    email: string,
    token: string,
    expiresAt: Date,
  ): Promise<void> {
    this.logger.log('Token de restablecimiento de contraseña generado (sin enviar por email)', {
      tenantSlug,
      email,
      token,
      expiresAt: expiresAt.toISOString(),
    });
    return Promise.resolve();
  }
}
