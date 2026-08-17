import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_SUPPLIERS, withTenantScope } from '@gorazus/core-database';
import type { SuppliersPrismaClient } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import { ProveedorLookupRepository, type ProveedorLookup } from './proveedor-lookup.repository';

@Injectable()
export class ProveedorLookupRepositoryPrisma extends ProveedorLookupRepository {
  constructor(@Inject(PRISMA_SUPPLIERS) private readonly client: SuppliersPrismaClient) {
    super();
  }

  async obtenerProveedor(
    context: UserContext,
    supplierId: string,
  ): Promise<ProveedorLookup | null> {
    const proveedor = await withTenantScope(this.client, context, (tx) =>
      tx.suppliers.findFirst({
        where: { id: supplierId, deleted_at: null },
        select: { id: true, is_blocked: true },
      }),
    );
    if (!proveedor) return null;
    return { id: proveedor.id, isBlocked: proveedor.is_blocked };
  }
}
