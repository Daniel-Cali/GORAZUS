import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CORE } from '@gorazus/core-database';
import type { CorePrismaClient, tenants } from '@gorazus/core-database';
import { TenantRepository } from './tenant.repository';

/** Sin `withTenantScope` — la política `tenant_lookup_by_slug` (docs/database/sql/30_backup_restore.sql) permite este SELECT puntual sin `app.current_tenant_id` seteado. */
@Injectable()
export class TenantRepositoryPrisma extends TenantRepository {
  constructor(@Inject(PRISMA_CORE) private readonly client: CorePrismaClient) {
    super();
  }

  async findBySlug(slug: string): Promise<tenants | null> {
    return this.client.tenants.findFirst({ where: { slug, deleted_at: null } });
  }
}
