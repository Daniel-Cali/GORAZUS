import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { InventoryPrisma, inventory_lots } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { InventoryLotRepository } from '../repositories/inventory-lot.repository';

const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

export class LoteNoEncontradoException extends DomainException {
  constructor(id: string) {
    super('LOTE_NO_ENCONTRADO', `No existe el lote "${id}".`, 404);
  }
}

/**
 * Inventario Parte 05, Subfase 3 — consultas de trazabilidad de lotes
 * ("Find stock by lot", vencimientos). Solo lectura: la creación/consumo de
 * lotes vive en `RecepcionesInventarioService`/`SalidasInventarioService`
 * (únicos puntos que tocan `remaining_quantity`, vía el motor de
 * movimientos — este servicio nunca escribe).
 */
@Injectable()
export class LotesInventarioService {
  constructor(private readonly inventoryLotRepository: InventoryLotRepository) {}

  async obtenerPorId(context: UserContext, id: string): Promise<inventory_lots> {
    const lote = await this.inventoryLotRepository.obtenerPorId(context, id);
    if (!lote) throw new LoteNoEncontradoException(id);
    return lote;
  }

  /** "Find stock by lot" — lotes de un producto (opcionalmente filtrados por almacén), con `remaining_quantity` disponible por lote. */
  async listarPorProducto(
    context: UserContext,
    productId: string | undefined,
    warehouseId: string | undefined,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<inventory_lots>> {
    const filter: InventoryPrisma.inventory_lotsWhereInput = {
      ...(productId && { product_id: productId }),
      ...(warehouseId && { warehouse_id: warehouseId }),
    };
    return this.inventoryLotRepository.listar(context, filter, pagination);
  }

  async listarProximosAVencer(
    context: UserContext,
    dias: number,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<inventory_lots>> {
    const hasta = new Date(Date.now() + dias * MILISEGUNDOS_POR_DIA);
    return this.inventoryLotRepository.listarProximosAVencer(context, hasta, pagination);
  }

  async listarVencidos(
    context: UserContext,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<inventory_lots>> {
    return this.inventoryLotRepository.listarVencidos(context, pagination);
  }
}
