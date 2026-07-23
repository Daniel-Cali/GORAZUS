import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_INVENTORY, withTenantScope } from '@gorazus/core-database';
import type {
  InventoryPrisma,
  InventoryPrismaClient,
  stock,
  stock_movements,
} from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import {
  MovimientoStockRepository,
  StockInsuficienteError,
  type RegistrarMovimientoParams,
} from './movimiento-stock.repository';

@Injectable()
export class MovimientoStockRepositoryPrisma extends MovimientoStockRepository {
  constructor(@Inject(PRISMA_INVENTORY) private readonly client: InventoryPrismaClient) {
    super();
  }

  async registrar(
    context: UserContext,
    params: RegistrarMovimientoParams,
  ): Promise<{ movimiento: stock_movements; stockActualizado: stock }> {
    return withTenantScope(this.client, context, async (tx) => {
      const stockActual = await tx.stock.findFirst({
        where: {
          product_id: params.productId,
          warehouse_id: params.warehouseId,
          location_id: params.locationId,
          deleted_at: null,
        },
      });
      const cantidadActual = stockActual ? Number(stockActual.quantity_on_hand) : 0;
      const nuevaCantidad =
        params.direction === 'in'
          ? cantidadActual + params.quantity
          : cantidadActual - params.quantity;

      // TODO(Parte 03 — Reservas): comparar contra `quantity_available`
      // (a mano - reservado), no contra `quantity_on_hand` a secas, una
      // vez que existan reservas reales (hoy `quantity_reserved` siempre
      // es 0, ambas comparaciones son equivalentes — INVENTORY_HEALTH_REPORT.md §3).
      if (nuevaCantidad < 0) {
        throw new StockInsuficienteError(cantidadActual, params.quantity);
      }

      const stockActualizado = stockActual
        ? await tx.stock.update({
            where: { id: stockActual.id },
            data: { quantity_on_hand: nuevaCantidad },
          })
        : await tx.stock.create({
            data: {
              tenant_id: context.tenantId,
              company_id: params.companyId,
              branch_id: params.branchId,
              product_id: params.productId,
              warehouse_id: params.warehouseId,
              location_id: params.locationId,
              quantity_on_hand: nuevaCantidad,
              quantity_reserved: 0,
            },
          });

      const movimiento = await tx.stock_movements.create({
        data: {
          tenant_id: context.tenantId,
          company_id: params.companyId,
          branch_id: params.branchId,
          product_id: params.productId,
          warehouse_id: params.warehouseId,
          movement_type_id: params.movementTypeId,
          quantity: params.quantity,
          unit_cost: params.unitCost,
          source_module: params.sourceModule,
          source_entity_id: params.sourceEntityId,
          observations: params.observations,
        },
      });

      return { movimiento, stockActualizado };
    });
  }

  async listar(
    context: UserContext,
    filter: InventoryPrisma.stock_movementsWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<stock_movements>> {
    const { page, pageSize } = pagination;
    const where = { ...filter, deleted_at: null };
    return withTenantScope(this.client, context, async (tx) => {
      const [data, total] = await Promise.all([
        tx.stock_movements.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { created_at: 'desc' },
        }),
        tx.stock_movements.count({ where }),
      ]);
      return { data, meta: { page, pageSize, total } };
    });
  }
}
