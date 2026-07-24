import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_INVENTORY, withTenantScope } from '@gorazus/core-database';
import type {
  InventoryPrisma,
  InventoryPrismaClient,
  stock_reservations,
} from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import {
  ReservaStockRepository,
  CapacidadReservaInsuficienteError,
  ReservaYaLiberadaError,
  ReservaNoEncontradaError,
  type CrearReservaParams,
} from './reserva-stock.repository';

@Injectable()
export class ReservaStockRepositoryPrisma extends ReservaStockRepository {
  constructor(@Inject(PRISMA_INVENTORY) private readonly client: InventoryPrismaClient) {
    super();
  }

  async crear(context: UserContext, params: CrearReservaParams): Promise<stock_reservations> {
    return withTenantScope(this.client, context, async (tx) => {
      const stockActual = await tx.stock.findFirst({
        where: {
          product_id: params.productId,
          warehouse_id: params.warehouseId,
          location_id: null,
          deleted_at: null,
        },
      });
      const cantidadOnHand = stockActual ? Number(stockActual.quantity_on_hand) : 0;
      const cantidadReservada = stockActual ? Number(stockActual.quantity_reserved) : 0;
      const disponible = cantidadOnHand - cantidadReservada;

      if (params.quantity > disponible) {
        throw new CapacidadReservaInsuficienteError(disponible, params.quantity);
      }

      // disponible >= quantity > 0 garantiza que stockActual existe (si no
      // existiera, on_hand sería 0 y disponible también, y ya se habría
      // lanzado arriba) — no hace falta una rama de creación acá.
      await tx.stock.update({
        where: { id: stockActual!.id },
        data: { quantity_reserved: cantidadReservada + params.quantity },
      });

      return tx.stock_reservations.create({
        data: {
          tenant_id: context.tenantId,
          company_id: params.companyId,
          branch_id: params.branchId,
          product_id: params.productId,
          warehouse_id: params.warehouseId,
          quantity: params.quantity,
          source_module: params.sourceModule,
          source_entity_id: params.sourceEntityId,
          observations: params.observations,
        },
      });
    });
  }

  async liberar(context: UserContext, id: string): Promise<stock_reservations> {
    return withTenantScope(this.client, context, async (tx) => {
      const reserva = await tx.stock_reservations.findFirst({ where: { id, deleted_at: null } });
      if (!reserva) throw new ReservaNoEncontradaError(id);
      if (reserva.released_at) throw new ReservaYaLiberadaError(id);

      const stockActual = await tx.stock.findFirst({
        where: {
          product_id: reserva.product_id,
          warehouse_id: reserva.warehouse_id,
          location_id: null,
          deleted_at: null,
        },
      });
      if (stockActual) {
        const cantidadReservada = Number(stockActual.quantity_reserved);
        const nuevaCantidadReservada = Math.max(0, cantidadReservada - Number(reserva.quantity));
        await tx.stock.update({
          where: { id: stockActual.id },
          data: { quantity_reserved: nuevaCantidadReservada },
        });
      }

      return tx.stock_reservations.update({
        where: { id },
        data: { released_at: new Date() },
      });
    });
  }

  async obtener(context: UserContext, id: string): Promise<stock_reservations | null> {
    return withTenantScope(this.client, context, (tx) =>
      tx.stock_reservations.findFirst({ where: { id, deleted_at: null } }),
    );
  }

  async listar(
    context: UserContext,
    filter: InventoryPrisma.stock_reservationsWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<stock_reservations>> {
    const { page, pageSize } = pagination;
    const where = { ...filter, deleted_at: null };
    return withTenantScope(this.client, context, async (tx) => {
      const [data, total] = await Promise.all([
        tx.stock_reservations.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { created_at: 'desc' },
        }),
        tx.stock_reservations.count({ where }),
      ]);
      return { data, meta: { page, pageSize, total } };
    });
  }
}
