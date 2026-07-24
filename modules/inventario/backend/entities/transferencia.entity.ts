export type EstadoTransferencia = 'draft' | 'in_transit' | 'received' | 'cancelled';

export interface LineaTransferenciaInput {
  productId: string;
  quantity: number;
}

/**
 * Entidad de dominio pura sobre `inventory.stock_transfers` +
 * `stock_transfer_lines` — encabezado de transferencia entre almacenes
 * (`INVENTORY_ARCHITECTURE.md §6`). El flujo de estados
 * (`draft → in_transit → received`, o `draft → cancelled`) está
 * documentado en `docs/architecture/19-modulo-inventory.md §6`: una
 * transferencia genera 2 movimientos, nunca 1 — `transfer_out` al pasar
 * a `in_transit`, `transfer_in` al pasar a `received`. Cancelar solo
 * está permitido desde `draft` en esta parte — cancelar una
 * transferencia ya `in_transit` requeriría un movimiento de reversión
 * que el pedido original no especificó, ver `INVENTORY_TRANSFERENCIAS_REPORT.md §4`.
 */
export class Transferencia {
  constructor(
    public readonly id: string,
    public readonly sourceWarehouseId: string,
    public readonly destinationWarehouseId: string,
    public readonly documentNumber: string,
    public readonly lines: LineaTransferenciaInput[],
  ) {
    if (documentNumber.trim().length === 0) {
      throw new Error('El número de documento de la transferencia no puede estar vacío');
    }
    if (sourceWarehouseId === destinationWarehouseId) {
      throw new Error('El almacén de origen y el de destino no pueden ser el mismo');
    }
    if (lines.length === 0) {
      throw new Error('Una transferencia necesita al menos una línea');
    }
    for (const linea of lines) {
      if (linea.quantity <= 0) {
        throw new Error('La cantidad de cada línea debe ser mayor que cero');
      }
    }
  }
}

/** Transiciones válidas — cualquier otra combinación es un `EstadoInvalidoError`. */
export const TRANSICIONES_TRANSFERENCIA: Record<string, EstadoTransferencia[]> = {
  draft: ['in_transit', 'cancelled'],
  in_transit: ['received'],
  received: [],
  cancelled: [],
};
