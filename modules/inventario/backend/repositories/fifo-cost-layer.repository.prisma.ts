import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_INVENTORY, withTenantScope } from '@gorazus/core-database';
import type { InventoryPrismaClient, fifo_cost_layers } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import {
  FifoCostLayerRepository,
  type CrearCapaFifoParams,
  type ResultadoConsumoFifo,
} from './fifo-cost-layer.repository';
import { lockFifoLayerRows, CapaDeCostoInsuficienteError } from './cost-layer-lock.util';

@Injectable()
export class FifoCostLayerRepositoryPrisma extends FifoCostLayerRepository {
  constructor(@Inject(PRISMA_INVENTORY) private readonly client: InventoryPrismaClient) {
    super();
  }

  async crearCapa(context: UserContext, params: CrearCapaFifoParams): Promise<fifo_cost_layers> {
    return withTenantScope(this.client, context, (tx) =>
      tx.fifo_cost_layers.create({
        data: {
          tenant_id: context.tenantId,
          company_id: context.companyId,
          branch_id: context.branchId,
          product_id: params.productId,
          warehouse_id: params.warehouseId,
          source_receipt_line_id: params.sourceReceiptLineId ?? null,
          original_quantity: params.quantity,
          remaining_quantity: params.quantity,
          unit_cost: params.unitCost,
        },
      }),
    );
  }

  /**
   * Consume, de la capa más antigua a la más nueva, hasta cubrir
   * `quantity` — bloqueo (`lockFifoLayerRows`) + lectura + `UPDATE` de
   * `remaining_quantity` dentro de la MISMA transacción, mismo criterio
   * que `MovimientoStockRepositoryPrisma.aplicarMovimiento`: dos salidas
   * concurrentes no pueden consumir la misma capa dos veces.
   */
  async consumir(
    context: UserContext,
    params: { productId: string; warehouseId: string; quantity: number },
  ): Promise<ResultadoConsumoFifo> {
    return withTenantScope(this.client, context, async (tx) => {
      const capas = await lockFifoLayerRows(tx, {
        productId: params.productId,
        warehouseId: params.warehouseId,
      });

      let restante = params.quantity;
      let costoTotal = 0;
      const capasConsumidas: ResultadoConsumoFifo['capasConsumidas'] = [];

      for (const capa of capas) {
        if (restante <= 0) break;
        const disponibleEnCapa = Number(capa.remaining_quantity);
        const consumidoDeEstaCapa = Math.min(disponibleEnCapa, restante);
        const unitCost = Number(capa.unit_cost);

        await tx.fifo_cost_layers.update({
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
  ): Promise<fifo_cost_layers[]> {
    return withTenantScope(this.client, context, (tx) =>
      tx.fifo_cost_layers.findMany({
        where: {
          product_id: params.productId,
          warehouse_id: params.warehouseId,
          remaining_quantity: { gt: 0 },
          deleted_at: null,
        },
        orderBy: { created_at: 'asc' },
      }),
    );
  }
}
