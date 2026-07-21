import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { UserContext } from '@gorazus/contracts';
import { DomainException } from '@gorazus/core-http';
// eslint-disable-next-line @nx/enforce-module-boundaries -- packages/tooling no tiene project.json propio, ver modules/auth/backend/services/login.usecase.ts
import {
  encrypt,
  decrypt,
  generateTotpSecret,
  verifyTotpCode,
  type EncryptedPayload,
} from '../../../../packages/tooling/utils';
import { CredencialDosFactoresRepository } from '../repositories/credencial-dos-factores.repository';
import { CredencialDosFactores } from '../entities/credencial-dos-factores.entity';

const KEY_ID = 'seguridad-v1';
const METHOD_TOTP = 'totp';

export class DosFactoresYaConfiguradoException extends DomainException {
  constructor() {
    super(
      'DOS_FACTORES_YA_CONFIGURADO',
      'Ya existe una configuración de doble autenticación para este usuario.',
      409,
    );
  }
}

export class DosFactoresNoConfiguradoException extends DomainException {
  constructor() {
    super(
      'DOS_FACTORES_NO_CONFIGURADO',
      'No hay ninguna configuración de doble autenticación pendiente de confirmar.',
      404,
    );
  }
}

export class CodigoDosFactoresInvalidoException extends DomainException {
  constructor() {
    super('CODIGO_DOS_FACTORES_INVALIDO', 'El código ingresado no es válido.', 400);
  }
}

/**
 * 2FA "preparado" (Fase 02, ver comentario de cabecera de
 * `CredencialDosFactores`) — TOTP real (RFC 6238) vía
 * `packages/tooling/utils/totp.ts`, secreto cifrado en reposo con el mismo
 * mecanismo AES-256-GCM que `WhatsAppCredentialsService` (core/notifications),
 * clave propia `SEGURIDAD_ENCRYPTION_KEY`. No integrado a `LoginUseCase` todavía.
 */
@Injectable()
export class DosFactoresService {
  constructor(
    private readonly credencialRepository: CredencialDosFactoresRepository,
    private readonly configService: ConfigService,
  ) {}

  /** Genera un secreto nuevo y lo persiste sin confirmar — el cliente debe confirmarlo con un código real antes de que quede activo. */
  async iniciarConfiguracion(context: UserContext): Promise<{ secret: string }> {
    const existente = await this.credencialRepository.findByUserId(context, context.userId);
    if (existente) throw new DosFactoresYaConfiguradoException();

    const secret = generateTotpSecret();
    const encryptedSecret = JSON.stringify(encrypt(secret, KEY_ID, this.encryptionKey()));

    await this.credencialRepository.create(context, {
      tenant_id: context.tenantId,
      user_id: context.userId,
      method: METHOD_TOTP,
      encrypted_secret: encryptedSecret,
    });

    return { secret };
  }

  /** Confirma la configuración pendiente con un código TOTP real generado por la app autenticadora. */
  async confirmar(context: UserContext, code: string): Promise<void> {
    const registro = await this.credencialRepository.findByUserId(context, context.userId);
    if (!registro) throw new DosFactoresNoConfiguradoException();

    const credencial = new CredencialDosFactores(
      registro.id,
      registro.method,
      registro.confirmed_at,
    );
    try {
      credencial.verificarNoConfirmada();
    } catch {
      throw new DosFactoresYaConfiguradoException();
    }

    const secret = decrypt(
      JSON.parse(registro.encrypted_secret) as EncryptedPayload,
      this.encryptionKey(),
    );
    if (!verifyTotpCode(secret, code)) {
      throw new CodigoDosFactoresInvalidoException();
    }

    await this.credencialRepository.update(
      context,
      { id: registro.id },
      { confirmed_at: new Date() },
    );
  }

  /** Deshabilita 2FA — borrado lógico de la credencial (docs/database/01-modelo-conceptual.md §1.1). */
  async deshabilitar(context: UserContext): Promise<void> {
    const registro = await this.credencialRepository.findByUserId(context, context.userId);
    if (!registro) throw new DosFactoresNoConfiguradoException();

    await this.credencialRepository.softDelete(
      context,
      { id: registro.id },
      { deleted_at: new Date(), deleted_by: context.userId },
    );
  }

  /** `SEGURIDAD_ENCRYPTION_KEY` es hex de 64 caracteres (32 bytes) — AES-256-GCM exige exactamente 32 bytes de clave. */
  private encryptionKey(): Buffer {
    const hexKey = this.configService.get<string>('seguridad.encryptionKey') as string;
    return Buffer.from(hexKey, 'hex');
  }
}
