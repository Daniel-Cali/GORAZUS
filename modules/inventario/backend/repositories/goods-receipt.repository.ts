import type { InventoryPrisma, goods_receipts, goods_receipt_lines } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

export interface LineaRecepcionInventarioParams {
  productId: string;
  quantity: number;
  unitCost: number | null;
  /** Inventario Parte 05 Subfase 3: lote ya resuelto (find-or-create) por `RecepcionesInventarioService` antes de llamar `crear` — `null` para productos sin `tracks_lot`. */
  lotId: string | null;
  /** Inventario Parte 05 Subfase 3: se guarda en `metadata` (sin columna dedicada — una línea serializada de cantidad N produce N series, no 1:1 como `lotId`). Los `inventory_serials` reales se crean recién en `confirmar()`. */
  serialNumbers: string[] | null;
}

export interface CrearRecepcionInventarioParams {
  companyId: string;
  branchId: string | null;
  warehouseId: string;
  sourceModule: string | null;
  sourceEntityId: string | null;
  lines: LineaRecepcionInventarioParams[];
}

export type RecepcionInventarioConLineas = goods_receipts & {
  goods_receipt_lines: goods_receipt_lines[];
};

/**
 * `inventory.goods_receipts`/`goods_receipt_lines` — sin columna de estado en
 * el schema real (mismo patrón que `purchases.goods_receipt_notes`, ISSUE-25);
 * "confirmada" se deriva de si ya existen `stock_movements` con
 * `source_module`/`source_entity_id` apuntando a esta recepción — lo resuelve
 * `RecepcionesInventarioService`, no este repositorio.
 */
export abstract class GoodsReceiptRepository {
  abstract crear(
    context: UserContext,
    params: CrearRecepcionInventarioParams,
  ): Promise<RecepcionInventarioConLineas>;

  abstract obtener(context: UserContext, id: string): Promise<RecepcionInventarioConLineas | null>;

  abstract listar(
    context: UserContext,
    filter: InventoryPrisma.goods_receiptsWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<goods_receipts>>;

  abstract anular(context: UserContext, id: string): Promise<goods_receipts>;
}
