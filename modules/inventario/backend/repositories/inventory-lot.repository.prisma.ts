import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_INVENTORY, withTenantScope } from '@gorazus/core-database';
import type {
  InventoryPrisma,
  InventoryPrismaClient,
  inventory_lots,
} from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import {
  InventoryLotRepository,
  LoteNoDisponibleError,
  type CrearOIncrementarLoteParams,
  type ConsumirLoteParams,
} from './inventory-lot.repository';
import { esViolacionDeUnicidad } from './stock-lock.util';

@Injectable()
export class InventoryLotRepositoryPrisma extends InventoryLotRepository {
  constructor(@Inject(PRISMA_INVENTORY) private readonly client: InventoryPrismaClient) {
    super();
  }

  /**
   * Find-or-create sobre `uq_inventory_inventory_lots_identity` (tenant_id,
   * product_id, lot_number). Recibir el mismo lote dos veces es un negocio
   * válido (entregas parciales) — el segundo INSERT choca con el índice
   * único (P2002) y se recupera con un UPDATE incremental atómico, nunca
   * con un segundo INSERT. El UPDATE por sí solo (sin `SELECT ... FOR
   * UPDATE` previo) ya es atómico bajo MVCC de Postgres: dos incrementos
   * concurrentes serializan sobre el lock de fila del UPDATE.
   */
  async crearOIncrementar(
    context: UserContext,
    params: CrearOIncrementarLoteParams,
  ): Promise<inventory_lots> {
    return withTenantScope(this.client, context, async (tx) => {
      try {
        return await tx.inventory_lots.create({
          data: {
            tenant_id: context.tenantId,
            product_id: params.productId,
            warehouse_id: params.warehouseId,
            lot_number: params.lotNumber,
            expiry_date: params.expiryDate,
            remaining_quantity: params.quantity,
            metadata: {
              ...(params.manufactureDate
                ? { manufactureDate: params.manufactureDate.toISOString() }
                : {}),
              ...(params.supplierReference ? { supplierReference: params.supplierReference } : {}),
            },
          },
        });
      } catch (error) {
        if (!esViolacionDeUnicidad(error)) throw error;

        const incrementado = await tx.inventory_lots.update({
          where: {
            tenant_id_product_id_lot_number: {
              tenant_id: context.tenantId,
              product_id: params.productId,
              lot_number: params.lotNumber,
            },
          },
          data: { remaining_quantity: { increment: params.quantity } },
        });
        return incrementado;
      }
    });
  }

  async incrementar(
    context: UserContext,
    params: { lotId: string; quantity: number },
  ): Promise<inventory_lots> {
    return withTenantScope(this.client, context, (tx) =>
      tx.inventory_lots.update({
        where: { id: params.lotId },
        data: { remaining_quantity: { increment: params.quantity } },
      }),
    );
  }

  async moverAlmacen(
    context: UserContext,
    params: { lotId: string; warehouseId: string },
  ): Promise<inventory_lots> {
    return withTenantScope(this.client, context, (tx) =>
      tx.inventory_lots.update({
        where: { id: params.lotId },
        data: { warehouse_id: params.warehouseId },
      }),
    );
  }

  async consumir(context: UserContext, params: ConsumirLoteParams): Promise<inventory_lots> {
    return withTenantScope(this.client, context, async (tx) => {
      const lote = await tx.inventory_lots.findFirst({
        where: { id: params.lotId, deleted_at: null },
      });
      if (!lote) throw new LoteNoDisponibleError('no_existe');
      if (lote.product_id !== params.productId)
        throw new LoteNoDisponibleError('producto_no_coincide');

      // Decremento condicional atómico: `updateMany` con la cantidad disponible
      // en el `where` evita la carrera de leer-luego-escribir (dos consumos
      // concurrentes del mismo lote no pueden dejarlo negativo).
      const resultado = await tx.inventory_lots.updateMany({
        where: { id: params.lotId, remaining_quantity: { gte: params.quantity } },
        data: { remaining_quantity: { decrement: params.quantity } },
      });
      if (resultado.count === 0) throw new LoteNoDisponibleError('sin_disponibilidad');

      const actualizado = await tx.inventory_lots.findFirst({ where: { id: params.lotId } });
      if (!actualizado) throw new LoteNoDisponibleError('no_existe');
      return actualizado;
    });
  }

  async obtenerPorId(context: UserContext, id: string): Promise<inventory_lots | null> {
    return withTenantScope(this.client, context, (tx) =>
      tx.inventory_lots.findFirst({ where: { id, deleted_at: null } }),
    );
  }

  async listar(
    context: UserContext,
    filter: InventoryPrisma.inventory_lotsWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<inventory_lots>> {
    return withTenantScope(this.client, context, async (tx) => {
      const where: InventoryPrisma.inventory_lotsWhereInput = { ...filter, deleted_at: null };
      const [data, total] = await Promise.all([
        tx.inventory_lots.findMany({
          where,
          skip: (pagination.page - 1) * pagination.pageSize,
          take: pagination.pageSize,
          orderBy: { created_at: 'desc' },
        }),
        tx.inventory_lots.count({ where }),
      ]);
      return { data, meta: { page: pagination.page, pageSize: pagination.pageSize, total } };
    });
  }

  async listarProximosAVencer(
    context: UserContext,
    hasta: Date,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<inventory_lots>> {
    return this.listar(
      context,
      { expiry_date: { gte: new Date(), lte: hasta }, remaining_quantity: { gt: 0 } },
      pagination,
    );
  }

  async listarVencidos(
    context: UserContext,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<inventory_lots>> {
    return this.listar(context, { expiry_date: { lt: new Date() } }, pagination);
  }
}
