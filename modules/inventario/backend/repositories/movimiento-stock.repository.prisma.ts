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
import { lockStockRow } from './stock-lock.util';

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
   *
   * **No escribe `inventory.stock` acá.** `inventory.fn_apply_stock_movement`
   * (`docs/database/sql/26_triggers.sql`, `AFTER INSERT ON stock_movements`)
   * ya hace el upsert real (crea la fila si no existía, o suma el delta
   * si existía) apenas se inserta el movimiento — escribirlo TAMBIÉN acá
   * duplicaba el delta en cada movimiento (bug real: 100 de entrada
   * quedaba en 200, una salida de 3 sobre eso quedaba en 194 en vez de
   * 97). Descubierto en FASE 06 Parte 01 (checkout de POS) al ejercitar
   * por primera vez este camino contra Postgres real con el trigger
   * activo — nunca se había detectado antes porque Docker llevaba caído
   * desde antes de Fase 05 Parte 02, donde se escribió este código.
   * `lockStockRow` sigue siendo necesario acá: no para escribir, sino
   * para leer el saldo bajo `FOR UPDATE` y validar "no dejar
   * `quantity_on_hand` por debajo de lo reservado" contra un valor que
   * no puede cambiar por debajo nuestro mientras validamos.
   */
  private async aplicarMovimiento(
    tx: InventoryPrismaClient,
    context: UserContext,
    params: RegistrarMovimientoParams,
  ): Promise<{ movimiento: stock_movements; stockActualizado: stock }> {
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

    // El trigger ya corrió (síncrono, dentro del mismo INSERT) — releer
    // para devolver el saldo real posterior al movimiento.
    const stockActualizado = await lockStockRow(tx, {
      productId: params.productId,
      warehouseId: params.warehouseId,
      locationId: params.locationId,
    });
    if (!stockActualizado) {
      throw new Error(
        `inventory.stock no tiene fila para product=${params.productId} warehouse=${params.warehouseId} tras aplicar el movimiento — inventory.fn_apply_stock_movement no corrió como se esperaba.`,
      );
    }

    return { movimiento, stockActualizado: stockActualizado as unknown as stock };
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
