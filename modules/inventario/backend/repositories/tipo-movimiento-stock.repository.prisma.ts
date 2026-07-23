import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_INVENTORY, withTenantScope } from '@gorazus/core-database';
import type { InventoryPrismaClient } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import { TipoMovimientoStockRepository } from './tipo-movimiento-stock.repository';

@Injectable()
export class TipoMovimientoStockRepositoryPrisma extends TipoMovimientoStockRepository {
  constructor(@Inject(PRISMA_INVENTORY) client: InventoryPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.stock_movement_types.findUnique(args),
      findMany: (args) => tx.stock_movement_types.findMany(args),
      count: (args) => tx.stock_movement_types.count(args),
      create: (args) => tx.stock_movement_types.create(args),
      update: (args) => tx.stock_movement_types.update(args),
    }));
  }

  async existeCodigo(context: UserContext, code: string): Promise<boolean> {
    const tipo = await withTenantScope(this.client, context, (tx) =>
      tx.stock_movement_types.findFirst({
        where: { code, deleted_at: null },
        select: { id: true },
      }),
    );
    return tipo !== null;
  }

  async tieneMovimientos(context: UserContext, movementTypeId: string): Promise<boolean> {
    const movimiento = await withTenantScope(this.client, context, (tx) =>
      tx.stock_movements.findFirst({
        where: { movement_type_id: movementTypeId },
        select: { id: true },
      }),
    );
    return movimiento !== null;
  }
}
