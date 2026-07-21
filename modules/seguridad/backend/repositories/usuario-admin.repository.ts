import { BaseRepository } from '@gorazus/core-database';
import type { CorePrisma, CorePrismaClient, users } from '@gorazus/core-database';

/**
 * Adaptador de administración sobre `core.users` — distinto del
 * `UserRepository` de `modules/auth/backend` (enfocado en login):
 * `auth` autentica, `seguridad` administra el ciclo de vida
 * (alta/baja), docs/architecture/15-modulo-security.md §1. Ambos módulos
 * adaptan la misma tabla porque ninguno es su dueño (excepción de
 * propiedad ya fijada en docs/architecture/13-modulo-auth.md §0).
 */
export abstract class UsuarioAdminRepository extends BaseRepository<
  CorePrisma.usersWhereUniqueInput,
  CorePrisma.usersWhereInput,
  CorePrisma.usersUncheckedCreateInput,
  CorePrisma.usersUncheckedUpdateInput,
  users,
  CorePrismaClient
> {}
