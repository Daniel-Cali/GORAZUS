import { BaseRepository } from '@gorazus/core-database';
import type { CorePrisma, CorePrismaClient, users } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

/**
 * Puerto (interfaz) — solo los métodos que la capa de aplicación necesita
 * (docs/architecture/02 §3). `auth` adapta `core.users`, no lo posee
 * (docs/architecture/13-modulo-auth.md §0). Extiende `BaseRepository` para
 * heredar el CRUD genérico (`findById`, `create`, `update`, `softDelete`)
 * sin reimplementarlo — este archivo solo agrega el finder que el login
 * necesita y que `BaseRepository` no puede generalizar (buscar por email,
 * no por PK).
 */
export abstract class UserRepository extends BaseRepository<
  CorePrisma.usersWhereUniqueInput,
  CorePrisma.usersWhereInput,
  CorePrisma.usersUncheckedCreateInput,
  CorePrisma.usersUncheckedUpdateInput,
  users,
  CorePrismaClient
> {
  /** Sin alcance de tenant vía RLS todavía — el login busca ANTES de tener `UserContext` (no hay sesión previa que fije `app.current_tenant_id`). Filtra `tenant_id` explícitamente en el WHERE por esta razón puntual. */
  abstract findByEmail(tenantId: string, email: string): Promise<users | null>;
  abstract marcarUltimoLogin(context: UserContext, userId: string, fecha: Date): Promise<void>;
}
