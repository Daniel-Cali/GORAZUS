import { ApiProperty } from '@nestjs/swagger';

export class UsuarioAutenticadoDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() email!: string;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'JWT de acceso, vida corta (~15 min)' }) accessToken!: string;
  @ApiProperty({ type: UsuarioAutenticadoDto }) user!: UsuarioAutenticadoDto;
  @ApiProperty({ nullable: true }) activeCompanyId!: string | null;
  @ApiProperty({ nullable: true }) activeBranchId!: string | null;
}

export class LoginResponseEnvelopeDto {
  @ApiProperty({ type: LoginResponseDto }) data!: LoginResponseDto;
}

export class TwoFactorRequiredResponseDto {
  @ApiProperty({ description: 'Siempre `true` en esta forma de la respuesta.' })
  requiresTwoFactor!: true;
  @ApiProperty({
    description:
      'Token opaco de un solo uso, vida ~5 min — se envía a POST /auth/login/2fa junto al código TOTP.',
  })
  challengeToken!: string;
}

export class TwoFactorRequiredEnvelopeDto {
  @ApiProperty({ type: TwoFactorRequiredResponseDto }) data!: TwoFactorRequiredResponseDto;
}

export class RefreshResponseDto {
  @ApiProperty() accessToken!: string;
}

export class RefreshResponseEnvelopeDto {
  @ApiProperty({ type: RefreshResponseDto }) data!: RefreshResponseDto;
}

export class CurrentUserResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() email!: string;
  @ApiProperty() fullName!: string;
  @ApiProperty() isActive!: boolean;
  @ApiProperty({ nullable: true, type: String }) lastLoginAt!: Date | null;
  @ApiProperty() tenantId!: string;
  @ApiProperty({ nullable: true }) activeCompanyId!: string | null;
  @ApiProperty({ nullable: true }) activeBranchId!: string | null;
}

export class CurrentUserEnvelopeDto {
  @ApiProperty({ type: CurrentUserResponseDto }) data!: CurrentUserResponseDto;
}

export class SessionValidationResponseDto {
  @ApiProperty() valid!: true;
  @ApiProperty() userId!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() sessionId!: string;
  @ApiProperty({ nullable: true }) activeCompanyId!: string | null;
  @ApiProperty({ nullable: true }) activeBranchId!: string | null;
}

export class SessionValidationEnvelopeDto {
  @ApiProperty({ type: SessionValidationResponseDto }) data!: SessionValidationResponseDto;
}

export class RevokeTokenResponseDto {
  @ApiProperty({ description: 'Cantidad de sesiones revocadas (0, 1, o todas las activas).' })
  revokedSessions!: number;
}

export class RevokeTokenEnvelopeDto {
  @ApiProperty({ type: RevokeTokenResponseDto }) data!: RevokeTokenResponseDto;
}
