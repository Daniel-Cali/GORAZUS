import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_INVENTORY, withTenantScope } from '@gorazus/core-database';
import type { InventoryPrismaClient } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import { KardexRepository, type KardexEntry } from './kardex.repository';

interface RawKardexRow {
  product_id: string;
  warehouse_id: string;
  movement_type_id: string;
  direction: 'in' | 'out';
  quantity: unknown;
  unit_cost: unknown;
  movement_value: unknown;
  movement_date: Date;
  running_balance: unknown;
}

function mapRow(row: RawKardexRow): KardexEntry {
  return {
    productId: row.product_id,
    warehouseId: row.warehouse_id,
    movementTypeId: row.movement_type_id,
    direction: row.direction,
    quantity: String(row.quantity),
    unitCost: row.unit_cost === null ? null : String(row.unit_cost),
    movementValue: String(row.movement_value),
    movementDate: row.movement_date,
    runningBalance: String(row.running_balance),
  };
}

@Injectable()
export class KardexRepositoryPrisma extends KardexRepository {
  constructor(@Inject(PRISMA_INVENTORY) private readonly client: InventoryPrismaClient) {
    super();
  }

  async consultar(
    context: UserContext,
    filtro: { productId: string; warehouseId: string; desde?: Date; hasta?: Date },
    pagination: { page: number; pageSize: number },
  ): Promise<KardexEntry[]> {
    return withTenantScope(this.client, context, async (tx) => {
      const params: unknown[] = [filtro.productId, filtro.warehouseId];
      let query = `
        SELECT product_id, warehouse_id, movement_type_id, direction, quantity, unit_cost,
               movement_value, movement_date, running_balance
        FROM inventory.v_kardex
        WHERE product_id = $1 AND warehouse_id = $2
      `;
      if (filtro.desde) {
        params.push(filtro.desde);
        query += ` AND movement_date >= $${params.length}`;
      }
      if (filtro.hasta) {
        params.push(filtro.hasta);
        query += ` AND movement_date <= $${params.length}`;
      }
      params.push(pagination.pageSize, (pagination.page - 1) * pagination.pageSize);
      query += ` ORDER BY movement_date DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

      const txRaw = tx as unknown as {
        $queryRawUnsafe: (q: string, ...v: unknown[]) => Promise<RawKardexRow[]>;
      };
      const rows = await txRaw.$queryRawUnsafe(query, ...params);
      return rows.map(mapRow);
    });
  }
}
