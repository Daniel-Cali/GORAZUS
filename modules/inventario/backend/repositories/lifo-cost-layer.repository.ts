import type { lifo_cost_layers } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

export interface CrearCapaLifoParams {
  productId: string;
  warehouseId: string;
  quantity: number;
  unitCost: number;
}

export interface CapaLifoConsumida {
  layerId: string;
  quantityConsumed: number;
  unitCost: number;
}

export interface ResultadoConsumoLifo {
  costoUnitarioPonderado: number;
  capasConsumidas: CapaLifoConsumida[];
}

/**
 * `inventory.lifo_cost_layers` (`ADR-INV-004 §3.2`, UEPS). **Sin**
 * `source_receipt_line_id` — diferencia real de schema frente a
 * `fifo_cost_layers`, deuda ya registrada como `ISSUE-15`, no corregida
 * en esta fase (ver plan de implementación — no se toca schema/BD).
 */
export abstract class LifoCostLayerRepository {
  abstract crearCapa(context: UserContext, params: CrearCapaLifoParams): Promise<lifo_cost_layers>;

  /** Consume, de la capa más nueva a la más antigua, hasta cubrir `quantity` — lanza `CapaDeCostoInsuficienteError` si no alcanza (`cost-layer-lock.util.ts`). */
  abstract consumir(
    context: UserContext,
    params: { productId: string; warehouseId: string; quantity: number },
  ): Promise<ResultadoConsumoLifo>;

  abstract listarCapasActivas(
    context: UserContext,
    params: { productId: string; warehouseId: string },
  ): Promise<lifo_cost_layers[]>;
}
