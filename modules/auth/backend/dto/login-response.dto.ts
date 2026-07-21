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

export class RefreshResponseDto {
  @ApiProperty() accessToken!: string;
}

export class RefreshResponseEnvelopeDto {
  @ApiProperty({ type: RefreshResponseDto }) data!: RefreshResponseDto;
}
