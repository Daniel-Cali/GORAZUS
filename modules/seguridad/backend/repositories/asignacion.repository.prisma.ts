import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CORE, withTenantScope } from '@gorazus/core-database';
import type { CorePrismaClient } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import { AsignacionRepository } from './asignacion.repository';

@Injectable()
export class AsignacionRepositoryPrisma extends AsignacionRepository {
  constructor(@Inject(PRISMA_CORE) private readonly client: CorePrismaClient) {
    super();
  }

  async asignarPermisoARol(context: UserContext, rolId: string, permisoId: string): Promise<void> {
    await withTenantScope(this.client, context, (tx) =>
      tx.role_permissions.create({
        data: {
          tenant_id: context.tenantId,
          company_id: context.companyId,
          role_id: rolId,
          permission_id: permisoId,
        },
      }),
    );
  }

  async revocarPermisoDeRol(context: UserContext, rolId: string, permisoId: string): Promise<void> {
    await withTenantScope(this.client, context, (tx) =>
      tx.role_permissions.updateMany({
        where: { role_id: rolId, permission_id: permisoId, deleted_at: null },
        data: { deleted_at: new Date() },
      }),
    );
  }

  async asignarRolAUsuario(context: UserContext, userId: string, rolId: string): Promise<void> {
    await withTenantScope(this.client, context, (tx) =>
      tx.user_roles.create({
        data: {
          tenant_id: context.tenantId,
          company_id: context.companyId,
          user_id: userId,
          role_id: rolId,
        },
      }),
    );
  }

  async revocarRolDeUsuario(context: UserContext, userId: string, rolId: string): Promise<void> {
    await withTenantScope(this.client, context, (tx) =>
      tx.user_roles.updateMany({
        where: { user_id: userId, role_id: rolId, deleted_at: null },
        data: { deleted_at: new Date() },
      }),
    );
  }

  async resolverPermisosDeUsuario(
    context: Pick<UserContext, 'tenantId' | 'companyId'>,
    userId: string,
  ): Promise<string[]> {
    return withTenantScope(this.client, context, async (tx) => {
      const userRoles = await tx.user_roles.findMany({
        where: { user_id: userId, deleted_at: null },
        select: { role_id: true },
      });
      const roleIds = userRoles.map((r) => r.role_id);
      if (roleIds.length === 0) return [];

      const rolePermissions = await tx.role_permissions.findMany({
        where: { role_id: { in: roleIds }, deleted_at: null },
        select: { permission_id: true },
      });
      const permissionIds = [...new Set(rolePermissions.map((rp) => rp.permission_id))];
      if (permissionIds.length === 0) return [];

      const permissions = await tx.permissions.findMany({
        where: { id: { in: permissionIds }, deleted_at: null },
        select: { code: true },
      });
      return permissions.map((p) => p.code);
    });
  }
}
