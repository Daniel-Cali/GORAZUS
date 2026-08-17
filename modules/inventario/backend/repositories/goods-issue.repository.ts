import type { InventoryPrisma, goods_issues, goods_issue_lines } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

export interface LineaSalidaInventarioParams {
  productId: string;
  quantity: number;
  /** Inventario Parte 05 Subfase 3: lote existente ya validado por `SalidasInventarioService` — `null` para productos sin `tracks_lot`. */
  lotId: string | null;
  /** Inventario Parte 05 Subfase 3: series a emitir, guardadas en `metadata` (sin columna dedicada, mismo motivo que en Recepciones). La transición `in_stock -> issued` ocurre recién en `confirmar()`. */
  serialNumbers: string[] | null;
}

export interface CrearSalidaInventarioParams {
  companyId: string;
  branchId: string | null;
  warehouseId: string;
  reasonId: string | null;
  sourceModule: string | null;
  sourceEntityId: string | null;
  lines: LineaSalidaInventarioParams[];
}

export type SalidaInventarioConLineas = goods_issues & {
  goods_issue_lines: goods_issue_lines[];
};

/**
 * `inventory.goods_issues`/`goods_issue_lines` — sin columna de estado en el
 * schema real (mismo patrón que `goods_receipts`/`goods_receipt_notes`,
 * ISSUE-25). "confirmada" se deriva de si ya existen `stock_movements` con
 * `source_module`/`source_entity_id` apuntando a esta salida — lo resuelve
 * `SalidasInventarioService`, no este repositorio.
 */
export abstract class GoodsIssueRepository {
  abstract crear(
    context: UserContext,
    params: CrearSalidaInventarioParams,
  ): Promise<SalidaInventarioConLineas>;

  abstract obtener(context: UserContext, id: string): Promise<SalidaInventarioConLineas | null>;

  abstract listar(
    context: UserContext,
    filter: InventoryPrisma.goods_issuesWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<goods_issues>>;

  abstract anular(context: UserContext, id: string): Promise<goods_issues>;
}
