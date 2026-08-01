import type { average_cost_history } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

export interface CrearSnapshotPromedioParams {
  productId: string;
  warehouseId: string;
  newAverageCost: number;
}

/**
 * `inventory.average_cost_history` (`ADR-INV-004 §3.3`, Costo Promedio
 * Ponderado / Moving Average — el mismo mecanismo bajo dos nombres,
 * `Cost Engine.md`). Snapshot append-only: cada entrada recalcula y
 * agrega una fila nueva, nunca se actualiza una fila existente
 * (`Append-Only Ledger Pattern`).
 */
export abstract class AverageCostHistoryRepository {
  abstract obtenerUltimoPromedio(
    context: UserContext,
    params: { productId: string; warehouseId: string },
  ): Promise<average_cost_history | null>;

  abstract crearSnapshot(
    context: UserContext,
    params: CrearSnapshotPromedioParams,
  ): Promise<average_cost_history>;
}
