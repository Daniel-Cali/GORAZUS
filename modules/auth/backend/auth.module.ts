import { Module } from '@nestjs/common';
import { DatabaseModule } from '@gorazus/core-database';
import { AuthController } from './controllers/auth.controller';
import { LoginUseCase } from './services/login.usecase';
import { CompleteTwoFactorLoginUseCase } from './services/complete-two-factor-login.usecase';
import { IssueLoginSessionService } from './services/issue-login-session.service';
import { RefreshTokenUseCase } from './services/refresh-token.usecase';
import { LogoutUseCase } from './services/logout.usecase';
import { ForgotPasswordUseCase } from './services/forgot-password.usecase';
import { ResetPasswordUseCase } from './services/reset-password.usecase';
import { PasswordResetNotifier } from './services/password-reset-notifier.port';
import { EmailPasswordResetNotifier } from './services/email-password-reset-notifier';
import { TenantRepository } from './repositories/tenant.repository';
import { TenantRepositoryPrisma } from './repositories/tenant.repository.prisma';
import { UserRepository } from './repositories/user.repository';
import { UserRepositoryPrisma } from './repositories/user.repository.prisma';
import { SessionRepository } from './repositories/session.repository';
import { SessionRepositoryPrisma } from './repositories/session.repository.prisma';
import { TokenRepository } from './repositories/token.repository';
import { TokenRepositoryPrisma } from './repositories/token.repository.prisma';
import { LoginAttemptRepository } from './repositories/login-attempt.repository';
import { LoginAttemptRepositoryPrisma } from './repositories/login-attempt.repository.prisma';
import { TwoFactorCredentialRepository } from './repositories/two-factor-credential.repository';
import { TwoFactorCredentialRepositoryPrisma } from './repositories/two-factor-credential.repository.prisma';
import { OrganizationStatusRepository } from './repositories/organization-status.repository';
import { OrganizationStatusRepositoryPrisma } from './repositories/organization-status.repository.prisma';
import { GetCurrentUserUseCase } from './services/get-current-user.usecase';
import { ValidateTokenUseCase } from './services/validate-token.usecase';
import { RevokeTokenUseCase } from './services/revoke-token.usecase';

/**
 * Wiring de Nest (docs/architecture/02 §5) — `auth` no exporta ningún
 * servicio a otros módulos (a diferencia de `VentasModule` del ejemplo):
 * emite `UserContext` vía el JWT que firma, no un servicio inyectable que
 * otro módulo consuma directamente (docs/architecture/13-modulo-auth.md §1,
 * "auth solo emite el UserContext autenticado").
 */
@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    CompleteTwoFactorLoginUseCase,
    IssueLoginSessionService,
    RefreshTokenUseCase,
    LogoutUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    GetCurrentUserUseCase,
    ValidateTokenUseCase,
    RevokeTokenUseCase,
    { provide: TenantRepository, useClass: TenantRepositoryPrisma },
    { provide: UserRepository, useClass: UserRepositoryPrisma },
    { provide: SessionRepository, useClass: SessionRepositoryPrisma },
    { provide: TokenRepository, useClass: TokenRepositoryPrisma },
    { provide: LoginAttemptRepository, useClass: LoginAttemptRepositoryPrisma },
    { provide: TwoFactorCredentialRepository, useClass: TwoFactorCredentialRepositoryPrisma },
    { provide: OrganizationStatusRepository, useClass: OrganizationStatusRepositoryPrisma },
    { provide: PasswordResetNotifier, useClass: EmailPasswordResetNotifier },
  ],
})
export class AuthModule {}
