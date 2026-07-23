import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DomainException } from '@gorazus/core-http';
import { CacheService } from '@gorazus/core-cache';
// eslint-disable-next-line @nx/enforce-module-boundaries -- packages/tooling no tiene project.json propio, ver login.usecase.ts
import { decrypt, verifyTotpCode, type EncryptedPayload } from '../../../../packages/tooling/utils';
import { UserRepository } from '../repositories/user.repository';
import { TwoFactorCredentialRepository } from '../repositories/two-factor-credential.repository';
import { IssueLoginSessionService, LoginResult } from './issue-login-session.service';
import { twoFactorChallengeCacheKey, TwoFactorChallenge } from './two-factor-challenge';

export class DesafioDosFactoresInvalidoException extends DomainException {
  constructor() {
    super(
      'DESAFIO_DOS_FACTORES_INVALIDO',
      'El desafío de doble autenticación no existe o expiró — iniciá sesión de nuevo.',
      401,
    );
  }
}

export class CodigoDosFactoresInvalidoException extends DomainException {
  constructor() {
    super('CODIGO_DOS_FACTORES_INVALIDO', 'El código ingresado no es válido.', 400);
  }
}

/**
 * Segundo paso del login con 2FA (`POST /auth/login/2fa`) — completa lo que
 * `LoginUseCase` dejó pendiente cuando encontró una credencial TOTP
 * confirmada. El `challengeToken` es de un solo uso: se borra de Redis se
 * verifique bien o mal el código, para que un token filtrado no sirva de
 * segundo intento.
 */
@Injectable()
export class CompleteTwoFactorLoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly twoFactorCredentialRepository: TwoFactorCredentialRepository,
    private readonly issueLoginSessionService: IssueLoginSessionService,
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
  ) {}

  async execute(challengeToken: string, code: string): Promise<LoginResult> {
    const cacheKey = twoFactorChallengeCacheKey(challengeToken);
    const challenge = await this.cacheService.get<TwoFactorChallenge>(cacheKey);
    if (!challenge) {
      throw new DesafioDosFactoresInvalidoException();
    }
    await this.cacheService.del(cacheKey);

    const credencial = await this.twoFactorCredentialRepository.findConfirmedByUserId(
      challenge.tenantId,
      challenge.userId,
    );
    if (!credencial) {
      // Se deshabilitó 2FA entre el primer y el segundo paso — trata como
      // desafío inválido, no como código incorrecto (evita confundir al
      // cliente con un error que sugiere "reintentá el código").
      throw new DesafioDosFactoresInvalidoException();
    }

    const secret = decrypt(
      JSON.parse(credencial.encryptedSecret) as EncryptedPayload,
      this.encryptionKey(),
    );
    if (!verifyTotpCode(secret, code)) {
      throw new CodigoDosFactoresInvalidoException();
    }

    const record = await this.userRepository.findByEmail(challenge.tenantId, challenge.email);
    if (!record) {
      // El usuario se borró/desactivó entre el primer y el segundo paso —
      // caso extremo, mismo tratamiento que un desafío ya no válido.
      throw new DesafioDosFactoresInvalidoException();
    }

    return this.issueLoginSessionService.issue(record, {
      ipAddress: challenge.ipAddress,
      userAgent: challenge.userAgent,
      rememberMe: challenge.rememberMe,
    });
  }

  /** `SEGURIDAD_ENCRYPTION_KEY` es hex de 64 caracteres (32 bytes) — mismo criterio que `dos-factores.service.ts`. */
  private encryptionKey(): Buffer {
    const hexKey = this.configService.get<string>('seguridad.encryptionKey') as string;
    return Buffer.from(hexKey, 'hex');
  }
}
