import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_INVENTORY, withTenantScope } from '@gorazus/core-database';
import type { InventoryPrismaClient, lifo_cost_layers } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import {
  LifoCostLayerRepository,
  type CrearCapaLifoParams,
  type ResultadoConsumoLifo,
} from './lifo-cost-layer.repository';
import { lockLifoLayerRows, CapaDeCostoInsuficienteError } from './cost-layer-lock.util';

@Injectable()
export class LifoCostLayerRepositoryPrisma extends LifoCostLayerRepository {
  constructor(@Inject(PRISMA_INVENTORY) private readonly client: InventoryPrismaClient) {
    super();
  }

  async crearCapa(context: UserContext, params: CrearCapaLifoParams): Promise<lifo_cost_layers> {
    return withTenantScope(this.client, context, (tx) =>
      tx.lifo_cost_layers.create({
        data: {
          tenant_id: context.tenantId,
          company_id: context.companyId,
          branch_id: context.branchId,
          product_id: params.productId,
          warehouse_id: params.warehouseId,
          original_quantity: params.quantity,
          remaining_quantity: params.quantity,
          unit_cost: params.unitCost,
        },
      }),
    );
  }

  /** Igual que `FifoCostLayerRepositoryPrisma.consumir`, orden inverso (`lockLifoLayerRows`: más nueva primero). */
  async consumir(
    context: UserContext,
    params: { productId: string; warehouseId: string; quantity: number },
  ): Promise<ResultadoConsumoLifo> {
    return withTenantScope(this.client, context, async (tx) => {
      const capas = await lockLifoLayerRows(tx, {
        productId: params.productId,
        warehouseId: params.warehouseId,
      });

      let restante = params.quantity;
      let costoTotal = 0;
      const capasConsumidas: ResultadoConsumoLifo['capasConsumidas'] = [];

      for (const capa of capas) {
        if (restante <= 0) break;
        const disponibleEnCapa = Number(capa.remaining_quantity);
        const consumidoDeEstaCapa = Math.min(disponibleEnCapa, restante);
        const unitCost = Number(capa.unit_cost);

        await tx.lifo_cost_layers.update({
          where: { id: capa.id },
          data: { remaining_quantity: disponibleEnCapa - consumidoDeEstaCapa },
        });

        costoTotal += consumidoDeEstaCapa * unitCost;
        capasConsumidas.push({ layerId: capa.id, quantityConsumed: consumidoDeEstaCapa, unitCost });
        restante -= consumidoDeEstaCapa;
      }

      if (restante > 0) {
        throw new CapaDeCostoInsuficienteError(params.quantity - restante, params.quantity);
      }

      return {
        costoUnitarioPonderado: costoTotal / params.quantity,
        capasConsumidas,
      };
    });
  }

  async listarCapasActivas(
    context: UserContext,
    params: { productId: string; warehouseId: string },
  ): Promise<lifo_cost_layers[]> {
    return withTenantScope(this.client, context, (tx) =>
      tx.lifo_cost_layers.findMany({
        where: {
          product_id: params.productId,
          warehouse_id: params.warehouseId,
          remaining_quantity: { gt: 0 },
          deleted_at: null,
        },
        orderBy: { created_at: 'desc' },
      }),
    );
  }
}
