import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_INVENTORY, withTenantScope } from '@gorazus/core-database';
import type {
  InventoryPrisma,
  InventoryPrismaClient,
  inventory_serials,
} from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import {
  InventorySerialRepository,
  SerieInvalidaError,
  ESTADO_EN_STOCK,
  ESTADO_EMITIDA,
  type CrearSerieParams,
  type EmitirSerieParams,
} from './inventory-serial.repository';
import { esViolacionDeUnicidad } from './stock-lock.util';

@Injectable()
export class InventorySerialRepositoryPrisma extends InventorySerialRepository {
  constructor(@Inject(PRISMA_INVENTORY) private readonly client: InventoryPrismaClient) {
    super();
  }

  async crear(context: UserContext, params: CrearSerieParams): Promise<inventory_serials> {
    return withTenantScope(this.client, context, async (tx) => {
      try {
        return await tx.inventory_serials.create({
          data: {
            tenant_id: context.tenantId,
            product_id: params.productId,
            warehouse_id: params.warehouseId,
            serial_number: params.serialNumber,
            status: ESTADO_EN_STOCK,
            unit_cost: params.unitCost,
          },
        });
      } catch (error) {
        if (esViolacionDeUnicidad(error)) throw new SerieInvalidaError('duplicada');
        throw error;
      }
    });
  }

  /**
   * `updateMany` con `status: ESTADO_EN_STOCK` en el `where` hace la
   * transición condicional atómica — dos emisiones concurrentes de la misma
   * serie no pueden ambas "ganar" (regla "cannot issue already consumed
   * serial"), mismo patrón que `InventoryLotRepositoryPrisma.consumir`.
   */
  async emitir(context: UserContext, params: EmitirSerieParams): Promise<inventory_serials> {
    return withTenantScope(this.client, context, async (tx) => {
      const serie = await tx.inventory_serials.findFirst({
        where: { id: params.serialId, deleted_at: null },
      });
      if (!serie) throw new SerieInvalidaError('no_existe');
      if (serie.product_id !== params.productId)
        throw new SerieInvalidaError('producto_no_coincide');

      const resultado = await tx.inventory_serials.updateMany({
        where: { id: params.serialId, status: ESTADO_EN_STOCK },
        data: { status: ESTADO_EMITIDA },
      });
      if (resultado.count === 0) throw new SerieInvalidaError('ya_emitida');

      const actualizada = await tx.inventory_serials.findFirst({ where: { id: params.serialId } });
      if (!actualizada) throw new SerieInvalidaError('no_existe');
      return actualizada;
    });
  }

  async moverAlmacen(
    context: UserContext,
    params: { serialId: string; warehouseId: string },
  ): Promise<inventory_serials> {
    return withTenantScope(this.client, context, (tx) =>
      tx.inventory_serials.update({
        where: { id: params.serialId },
        data: { warehouse_id: params.warehouseId },
      }),
    );
  }

  async devolverStock(context: UserContext, params: EmitirSerieParams): Promise<inventory_serials> {
    return withTenantScope(this.client, context, async (tx) => {
      const serie = await tx.inventory_serials.findFirst({
        where: { id: params.serialId, deleted_at: null },
      });
      if (!serie) throw new SerieInvalidaError('no_existe');
      if (serie.product_id !== params.productId)
        throw new SerieInvalidaError('producto_no_coincide');

      const resultado = await tx.inventory_serials.updateMany({
        where: { id: params.serialId, status: ESTADO_EMITIDA },
        data: { status: ESTADO_EN_STOCK },
      });
      if (resultado.count === 0) throw new SerieInvalidaError('no_emitida');

      const actualizada = await tx.inventory_serials.findFirst({ where: { id: params.serialId } });
      if (!actualizada) throw new SerieInvalidaError('no_existe');
      return actualizada;
    });
  }

  async obtenerPorId(context: UserContext, id: string): Promise<inventory_serials | null> {
    return withTenantScope(this.client, context, (tx) =>
      tx.inventory_serials.findFirst({ where: { id, deleted_at: null } }),
    );
  }

  async obtenerPorNumero(
    context: UserContext,
    serialNumber: string,
  ): Promise<inventory_serials | null> {
    return withTenantScope(this.client, context, (tx) =>
      tx.inventory_serials.findFirst({
        where: { tenant_id: context.tenantId, serial_number: serialNumber, deleted_at: null },
      }),
    );
  }

  async listar(
    context: UserContext,
    filter: InventoryPrisma.inventory_serialsWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<inventory_serials>> {
    return withTenantScope(this.client, context, async (tx) => {
      const where: InventoryPrisma.inventory_serialsWhereInput = { ...filter, deleted_at: null };
      const [data, total] = await Promise.all([
        tx.inventory_serials.findMany({
          where,
          skip: (pagination.page - 1) * pagination.pageSize,
          take: pagination.pageSize,
          orderBy: { created_at: 'desc' },
        }),
        tx.inventory_serials.count({ where }),
      ]);
      return { data, meta: { page: pagination.page, pageSize: pagination.pageSize, total } };
    });
  }
}
