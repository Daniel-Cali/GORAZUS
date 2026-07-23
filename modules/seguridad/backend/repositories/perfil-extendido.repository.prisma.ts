import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CORE, withTenantScope } from '@gorazus/core-database';
import type { CorePrismaClient, user_profiles } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import { PerfilExtendidoRepository } from './perfil-extendido.repository';

@Injectable()
export class PerfilExtendidoRepositoryPrisma extends PerfilExtendidoRepository {
  constructor(@Inject(PRISMA_CORE) private readonly client: CorePrismaClient) {
    super();
  }

  async buscarPorUsuario(context: UserContext, userId: string): Promise<user_profiles | null> {
    return withTenantScope(this.client, context, (tx) =>
      tx.user_profiles.findFirst({ where: { user_id: userId, deleted_at: null } }),
    );
  }

  async upsert(
    context: UserContext,
    userId: string,
    data: {
      preferredLanguage?: string;
      preferredTimezone?: string;
      metadataPatch?: Record<string, unknown>;
    },
  ): Promise<user_profiles> {
    return withTenantScope(this.client, context, async (tx) => {
      const existente = await tx.user_profiles.findFirst({
        where: { user_id: userId, deleted_at: null },
      });

      const metadataExistente =
        existente && typeof existente.metadata === 'object' && existente.metadata !== null
          ? (existente.metadata as Record<string, unknown>)
          : {};
      const metadataNueva = data.metadataPatch
        ? { ...metadataExistente, ...data.metadataPatch }
        : metadataExistente;

      if (!existente) {
        return tx.user_profiles.create({
          data: {
            tenant_id: context.tenantId,
            company_id: context.companyId,
            branch_id: context.branchId,
            user_id: userId,
            preferred_language: data.preferredLanguage ?? 'es',
            preferred_timezone: data.preferredTimezone ?? 'UTC',
            metadata: metadataNueva as never,
          },
        });
      }

      return tx.user_profiles.update({
        where: { id: existente.id },
        data: {
          ...(data.preferredLanguage !== undefined && {
            preferred_language: data.preferredLanguage,
          }),
          ...(data.preferredTimezone !== undefined && {
            preferred_timezone: data.preferredTimezone,
          }),
          metadata: metadataNueva as never,
        },
      });
    });
  }
}
