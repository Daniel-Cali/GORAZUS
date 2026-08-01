import type { fifo_cost_layers } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

export interface CrearCapaFifoParams {
  productId: string;
  warehouseId: string;
  quantity: number;
  unitCost: number;
  /** Opcional — `goods_receipt_lines` (recepciones) todavía no tiene código de aplicación (`INVENTORY_NEXT_PHASE.md`, Parte 05); se deja el campo listo para cuando exista, `ADR-INV-004 §3.1`. */
  sourceReceiptLineId?: string | null;
}

export interface CapaFifoConsumida {
  layerId: string;
  quantityConsumed: number;
  unitCost: number;
}

export interface ResultadoConsumoFifo {
  costoUnitarioPonderado: number;
  capasConsumidas: CapaFifoConsumida[];
}

/**
 * `inventory.fifo_cost_layers` (`ADR-INV-004 §3.1`, PEPS). `consumir` es
 * una operación atómica (bloqueo + lectura + `UPDATE` de `remaining_quantity`
 * dentro de la misma transacción) — mismo criterio que
 * `MovimientoStockRepository.registrar`: la lógica que necesita bloqueo de
 * fila vive en el adaptador, no en el service.
 */
export abstract class FifoCostLayerRepository {
  abstract crearCapa(context: UserContext, params: CrearCapaFifoParams): Promise<fifo_cost_layers>;

  /** Consume, de la capa más antigua a la más nueva, hasta cubrir `quantity` — lanza `CapaDeCostoInsuficienteError` si no alcanza (`cost-layer-lock.util.ts`). */
  abstract consumir(
    context: UserContext,
    params: { productId: string; warehouseId: string; quantity: number },
  ): Promise<ResultadoConsumoFifo>;

  abstract listarCapasActivas(
    context: UserContext,
    params: { productId: string; warehouseId: string },
  ): Promise<fifo_cost_layers[]>;
}
