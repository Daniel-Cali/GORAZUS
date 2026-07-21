import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '@gorazus/core-database';
import { PERMISSIONS_RESOLVER } from '@gorazus/core-http';
import { RolesController } from './controllers/roles.controller';
import { UsuariosController } from './controllers/usuarios.controller';
import { AuditoriaController } from './controllers/auditoria.controller';
import { RolesService } from './services/roles.service';
import { UsuariosAdminService } from './services/usuarios-admin.service';
import { PermissionsResolverService } from './services/permissions-resolver.service';
import { AuditoriaService } from './services/auditoria.service';
import { RolRepository } from './repositories/rol.repository';
import { RolRepositoryPrisma } from './repositories/rol.repository.prisma';
import { PermisoRepository } from './repositories/permiso.repository';
import { PermisoRepositoryPrisma } from './repositories/permiso.repository.prisma';
import { AsignacionRepository } from './repositories/asignacion.repository';
import { AsignacionRepositoryPrisma } from './repositories/asignacion.repository.prisma';
import { UsuarioAdminRepository } from './repositories/usuario-admin.repository';
import { UsuarioAdminRepositoryPrisma } from './repositories/usuario-admin.repository.prisma';
import { AuditoriaRepository } from './repositories/auditoria.repository';
import { AuditoriaRepositoryPrisma } from './repositories/auditoria.repository.prisma';

/**
 * `@Global()` a propósito — el `PermissionsGuard` global de `core/http`
 * (registrado dentro de `HttpModule`) necesita inyectar `PERMISSIONS_RESOLVER`
 * sin que `HttpModule` importe `SeguridadModule` directamente (eso invertiría
 * la regla de capas: `type:core` no puede depender de `type:backend`). Marcar
 * este módulo `@Global()` es lo que hace que el token quede visible en toda
 * la app con solo importar `SeguridadModule` una vez en `AppModule` — mismo
 * mecanismo que `DatabaseModule`/`HttpModule` ya usan para sus propios globals.
 */
@Global()
@Module({
  imports: [DatabaseModule],
  controllers: [RolesController, UsuariosController, AuditoriaController],
  providers: [
    RolesService,
    UsuariosAdminService,
    PermissionsResolverService,
    AuditoriaService,
    { provide: PERMISSIONS_RESOLVER, useExisting: PermissionsResolverService },
    { provide: RolRepository, useClass: RolRepositoryPrisma },
    { provide: PermisoRepository, useClass: PermisoRepositoryPrisma },
    { provide: AsignacionRepository, useClass: AsignacionRepositoryPrisma },
    { provide: UsuarioAdminRepository, useClass: UsuarioAdminRepositoryPrisma },
    { provide: AuditoriaRepository, useClass: AuditoriaRepositoryPrisma },
  ],
  exports: [PERMISSIONS_RESOLVER],
})
export class SeguridadModule {}
