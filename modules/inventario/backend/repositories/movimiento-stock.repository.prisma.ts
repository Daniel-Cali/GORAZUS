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
import { lockStockRow, esViolacionDeUnicidad } from './stock-lock.util';

const MAX_INTENTOS_CARRERA = 2;

@Injectable()
export class MovimientoStockRepositoryPrisma extends MovimientoStockRepository {
  constructor(@Inject(PRISMA_INVENTORY) private readonly client: InventoryPrismaClient) {
    super();
  }

  /**
   * Cuerpo real de un movimiento, factorizado para poder correr uno solo
   * (`registrar`) o varios dentro de la MISMA transacción (`registrarLote`
   * — Parte 03/04: transferencias y ajustes con varias líneas se aplican
   * completos o nada). Bloquea la fila de `stock` (`SELECT ... FOR
   * UPDATE`, Parte 04) antes de leer el saldo — si dos movimientos
   * concurrentes apuntan al mismo `(product, warehouse, location)`, el
   * segundo espera a que el primero confirme antes de leer, en vez de
   * arriesgarse a leer el mismo saldo viejo que el primero.
   */
  private async aplicarMovimiento(
    tx: InventoryPrismaClient,
    context: UserContext,
    params: RegistrarMovimientoParams,
  ): Promise<{ movimiento: stock_movements; stockActualizado: stock }> {
    for (let intento = 1; intento <= MAX_INTENTOS_CARRERA; intento++) {
      const stockActual = await lockStockRow(tx, {
        productId: params.productId,
        warehouseId: params.warehouseId,
        locationId: params.locationId,
      });
      const cantidadActual = stockActual ? Number(stockActual.quantity_on_hand) : 0;
      const cantidadReservada = stockActual ? Number(stockActual.quantity_reserved) : 0;
      const nuevaCantidad =
        params.direction === 'in'
          ? cantidadActual + params.quantity
          : cantidadActual - params.quantity;

      // Una salida nunca puede dejar `quantity_on_hand` por debajo de lo
      // reservado para otros — comparar contra disponible real (a mano -
      // reservado), no contra "a mano" a secas (Parte 03).
      if (params.direction === 'out' && nuevaCantidad < cantidadReservada) {
        throw new StockInsuficienteError(cantidadActual - cantidadReservada, params.quantity);
      }

      try {
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
      } catch (error) {
        // Carrera real: no había fila (`stockActual === null`) y otra
        // transacción concurrente insertó la misma combinación
        // product/warehouse/location entre nuestro `SELECT ... FOR
        // UPDATE` (que no encontró nada) y este `INSERT` — el índice
        // único parcial `uq_inventory_stock` la rechaza. Se reintenta:
        // la próxima vuelta del `for` sí va a encontrar (y bloquear) la
        // fila que el otro ya creó.
        if (!stockActual && esViolacionDeUnicidad(error) && intento < MAX_INTENTOS_CARRERA) {
          continue;
        }
        throw error;
      }
    }
    throw new Error('No se pudo aplicar el movimiento tras reintentos por concurrencia');
  }

  async registrar(
    context: UserContext,
    params: RegistrarMovimientoParams,
  ): Promise<{ movimiento: stock_movements; stockActualizado: stock }> {
    return withTenantScope(this.client, context, (tx) =>
      this.aplicarMovimiento(tx, context, params),
    );
  }

  async registrarLote(
    context: UserContext,
    items: RegistrarMovimientoParams[],
  ): Promise<Array<{ movimiento: stock_movements; stockActualizado: stock }>> {
    return withTenantScope(this.client, context, async (tx) => {
      const resultados: Array<{ movimiento: stock_movements; stockActualizado: stock }> = [];
      for (const params of items) {
        resultados.push(await this.aplicarMovimiento(tx, context, params));
      }
      return resultados;
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
