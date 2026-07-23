import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { InventoryPrisma, stock } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { StockRepository } from '../repositories/stock.repository';
import { Stock } from '../entities/stock.entity';

export interface StockConDisponible {
  productId: string;
  warehouseId: string;
  locationId: string | null;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
}

function aStockConDisponible(row: stock): StockConDisponible {
  const entidad = new Stock(
    row.product_id,
    row.warehouse_id,
    row.location_id,
    Number(row.quantity_on_hand),
    Number(row.quantity_reserved),
  );
  return {
    productId: entidad.productId,
    warehouseId: entidad.warehouseId,
    locationId: entidad.locationId,
    quantityOnHand: entidad.quantityOnHand,
    quantityReserved: entidad.quantityReserved,
    quantityAvailable: entidad.quantityAvailable,
  };
}

/**
 * Consultas de solo lectura sobre `inventory.stock` —
 * `inventory.v_available_stock` es una simple resta
 * (`quantity_on_hand - quantity_reserved`, `docs/database/sql/24_views.sql`),
 * se calcula acá en vez de una segunda consulta a la vista.
 */
@Injectable()
export class StockService {
  constructor(private readonly stockRepository: StockRepository) {}

  async obtenerDisponible(
    context: UserContext,
    filtro: { productId: string; warehouseId: string; locationId?: string },
  ): Promise<StockConDisponible> {
    const fila = await this.stockRepository.obtener(context, {
      productId: filtro.productId,
      warehouseId: filtro.warehouseId,
      locationId: filtro.locationId ?? null,
    });
    if (!fila) {
      return {
        productId: filtro.productId,
        warehouseId: filtro.warehouseId,
        locationId: filtro.locationId ?? null,
        quantityOnHand: 0,
        quantityReserved: 0,
        quantityAvailable: 0,
      };
    }
    return aStockConDisponible(fila);
  }

  async listar(
    context: UserContext,
    filter: InventoryPrisma.stockWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<StockConDisponible>> {
    const resultado = await this.stockRepository.listar(context, filter, pagination);
    return { data: resultado.data.map(aStockConDisponible), meta: resultado.meta };
  }
}
