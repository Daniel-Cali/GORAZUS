import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CORE, withTenantScope } from '@gorazus/core-database';
import type { CorePrismaClient, user_companies } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import { EmpresaUsuarioRepository } from './empresa-usuario.repository';

@Injectable()
export class EmpresaUsuarioRepositoryPrisma extends EmpresaUsuarioRepository {
  constructor(@Inject(PRISMA_CORE) private readonly client: CorePrismaClient) {
    super();
  }

  async listarPorUsuario(context: UserContext, userId: string): Promise<user_companies[]> {
    return withTenantScope(this.client, context, (tx) =>
      tx.user_companies.findMany({ where: { user_id: userId, deleted_at: null } }),
    );
  }

  async asignar(
    context: UserContext,
    userId: string,
    companyId: string,
    isDefault: boolean,
  ): Promise<user_companies> {
    return withTenantScope(this.client, context, async (tx) => {
      if (isDefault) {
        await tx.user_companies.updateMany({
          where: { user_id: userId, deleted_at: null, is_default: true },
          data: { is_default: false },
        });
      }
      return tx.user_companies.create({
        data: {
          tenant_id: context.tenantId,
          company_id: context.companyId,
          user_id: userId,
          target_company_id: companyId,
          is_default: isDefault,
        },
      });
    });
  }

  async desasignar(context: UserContext, userId: string, companyId: string): Promise<void> {
    await withTenantScope(this.client, context, (tx) =>
      tx.user_companies.updateMany({
        where: { user_id: userId, target_company_id: companyId, deleted_at: null },
        data: { deleted_at: new Date() },
      }),
    );
  }

  async yaAsignada(context: UserContext, userId: string, companyId: string): Promise<boolean> {
    const existente = await withTenantScope(this.client, context, (tx) =>
      tx.user_companies.findFirst({
        where: { user_id: userId, target_company_id: companyId, deleted_at: null },
        select: { id: true },
      }),
    );
    return existente !== null;
  }

  async empresaActiva(context: UserContext, companyId: string): Promise<boolean> {
    const empresa = await withTenantScope(this.client, context, (tx) =>
      tx.companies.findFirst({
        where: { id: companyId, deleted_at: null },
        select: { is_active: true },
      }),
    );
    return empresa?.is_active ?? false;
  }
}
