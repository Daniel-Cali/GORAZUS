export const ESTRATEGIAS_PICKING_VALIDAS = ['fifo', 'lifo', 'fefo', 'nearest_location'] as const;
export type EstrategiaPicking = (typeof ESTRATEGIAS_PICKING_VALIDAS)[number];

/**
 * Entidad de dominio pura sobre `inventory.picking_rules` — WMS Basic
 * (Prompt 1, Foundation Completion). Una estrategia por almacén (no hay
 * columna de prioridad ni de producto en el schema real — `strategy` es un
 * `String` libre; esta entidad restringe el conjunto válido a las 4
 * estrategias reconocidas por el resto del dominio, FIFO/LIFO ya
 * existentes como método de costeo, FEFO relevante para productos con
 * `tracks_lot`/`expiry_date`).
 */
export class PickingRule {
  constructor(
    public readonly warehouseId: string,
    public readonly strategy: string,
  ) {
    if (!ESTRATEGIAS_PICKING_VALIDAS.includes(strategy as EstrategiaPicking)) {
      throw new Error(
        `Estrategia de picking inválida: "${strategy}". Válidas: ${ESTRATEGIAS_PICKING_VALIDAS.join(', ')}`,
      );
    }
  }
}
