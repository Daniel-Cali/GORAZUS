import type { InventoryPrisma, inventory_lots } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

export interface CrearOIncrementarLoteParams {
  productId: string;
  warehouseId: string | null;
  lotNumber: string;
  quantity: number;
  expiryDate: Date | null;
  manufactureDate: Date | null;
  supplierReference: string | null;
}

export interface ConsumirLoteParams {
  lotId: string;
  productId: string;
  quantity: number;
}

/** Lanzado por el adaptador si el lote no existe, no pertenece al producto indicado, o no tiene disponibilidad — traducido a excepción de dominio en el servicio. */
export class LoteNoDisponibleError extends Error {
  constructor(public readonly motivo: 'no_existe' | 'producto_no_coincide' | 'sin_disponibilidad') {
    super(`Lote no disponible: ${motivo}`);
  }
}

/**
 * `inventory.inventory_lots` — Inventario Parte 05, Subfase 3. Un lote
 * agrupa cantidad (`remaining_quantity`), nunca representa una unidad
 * física (ver `InventorySerialRepository` para eso). Identidad única real
 * `(tenant_id, product_id, lot_number)` — `46_stock_movements_lot_serial_traceability.sql`
 * — `crearOIncrementar` es el find-or-create que se apoya en ella: recibir
 * el mismo lote dos veces suma cantidad, nunca duplica la fila.
 */
export abstract class InventoryLotRepository {
  /**
   * Find-or-create de la IDENTIDAD del lote. `RecepcionesInventarioService.crear`
   * llama esto con `quantity: 0` — el borrador solo necesita el `lotId` para
   * la línea, la cantidad real recién se suma en `confirmar()` vía
   * `incrementar` (RULE: el estado derivado no debe reflejar efectos de
   * stock antes de confirmar, mismo criterio que `unit_cost` en la línea
   * vs. la capa de costeo real).
   */
  abstract crearOIncrementar(
    context: UserContext,
    params: CrearOIncrementarLoteParams,
  ): Promise<inventory_lots>;

  /** Incremento atómico de `remaining_quantity` por id — usado en `confirmar()` una vez que el `lotId` ya se resolvió en `crear()`. */
  abstract incrementar(
    context: UserContext,
    params: { lotId: string; quantity: number },
  ): Promise<inventory_lots>;

  /**
   * Reasigna `warehouse_id` — usado por `TransferenciasService.recibir()`
   * SOLO cuando se transfiere la cantidad COMPLETA del lote (`remaining_quantity`).
   * Un lote es una fila con un único `warehouse_id`; transferir una parte
   * de su cantidad no puede representarse sin partir la fila en dos (fuera
   * de alcance) — ver "Known limitations" del informe de Prompt 1.
   */
  abstract moverAlmacen(
    context: UserContext,
    params: { lotId: string; warehouseId: string },
  ): Promise<inventory_lots>;

  /** Decremento atómico de `remaining_quantity` — lanza `LoteNoDisponibleError` si el lote no existe, es de otro producto, o no alcanza la cantidad. */
  abstract consumir(context: UserContext, params: ConsumirLoteParams): Promise<inventory_lots>;

  abstract obtenerPorId(context: UserContext, id: string): Promise<inventory_lots | null>;

  abstract listar(
    context: UserContext,
    filter: InventoryPrisma.inventory_lotsWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<inventory_lots>>;

  /** Lotes con `expiry_date` entre hoy y `hasta` (inclusive), no vencidos todavía. */
  abstract listarProximosAVencer(
    context: UserContext,
    hasta: Date,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<inventory_lots>>;

  /** Lotes con `expiry_date` en el pasado. No implementa destrucción automática — solo consulta (regla explícita de la misión). */
  abstract listarVencidos(
    context: UserContext,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<inventory_lots>>;
}
