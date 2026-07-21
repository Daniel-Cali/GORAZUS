import { Module } from '@nestjs/common';
import { DatabaseModule } from '@gorazus/core-database';
import { AuthController } from './controllers/auth.controller';
import { LoginUseCase } from './services/login.usecase';
import { RefreshTokenUseCase } from './services/refresh-token.usecase';
import { LogoutUseCase } from './services/logout.usecase';
import { TenantRepository } from './repositories/tenant.repository';
import { TenantRepositoryPrisma } from './repositories/tenant.repository.prisma';
import { UserRepository } from './repositories/user.repository';
import { UserRepositoryPrisma } from './repositories/user.repository.prisma';
import { SessionRepository } from './repositories/session.repository';
import { SessionRepositoryPrisma } from './repositories/session.repository.prisma';

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
    RefreshTokenUseCase,
    LogoutUseCase,
    { provide: TenantRepository, useClass: TenantRepositoryPrisma },
    { provide: UserRepository, useClass: UserRepositoryPrisma },
    { provide: SessionRepository, useClass: SessionRepositoryPrisma },
  ],
})
export class AuthModule {}
