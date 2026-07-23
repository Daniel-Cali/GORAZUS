import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { InventoryPrisma, stock_movements } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import {
  MovimientoStockRepository,
  StockInsuficienteError,
} from '../repositories/movimiento-stock.repository';
import { TipoMovimientoStockRepository } from '../repositories/tipo-movimiento-stock.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import { AlmacenRepository } from '../repositories/almacen.repository';
import { UbicacionAlmacenRepository } from '../repositories/ubicacion-almacen.repository';
import { MovimientoStock } from '../entities/movimiento-stock.entity';
import type { RegistrarMovimientoInput } from '../validators/movimientos.schema';

export class ProductoInvalidoException extends DomainException {
  constructor(productId: string) {
    super('PRODUCTO_INVALIDO', `No existe el producto "${productId}".`, 400);
  }
}

export class AlmacenInvalidoException extends DomainException {
  constructor(warehouseId: string) {
    super('ALMACEN_INVALIDO', `No existe el almacén "${warehouseId}".`, 400);
  }
}

export class UbicacionInvalidaException extends DomainException {
  constructor(locationId: string) {
    super('UBICACION_INVALIDA', `No existe la ubicación "${locationId}".`, 400);
  }
}

export class TipoMovimientoInvalidoException extends DomainException {
  constructor(movementTypeId: string) {
    super('TIPO_MOVIMIENTO_INVALIDO', `No existe el tipo de movimiento "${movementTypeId}".`, 400);
  }
}

export class StockInsuficienteException extends DomainException {
  constructor(disponible: number, solicitado: number) {
    super(
      'STOCK_INSUFICIENTE',
      `Stock insuficiente: disponible ${disponible}, solicitado ${solicitado}.`,
      409,
    );
  }
}

/**
 * Motor de movimientos — única puerta de entrada para modificar
 * `inventory.stock` (`INVENTORY_ARCHITECTURE.md §6`). Cualquier módulo
 * futuro (Compras, Ventas, Producción — Parte 03 en adelante de esta
 * fase) registra sus entradas/salidas acá, nunca tocando `stock`
 * directo — mismo `source_module`/`source_entity_id` polimórfico que ya
 * documenta `docs/architecture/19-modulo-inventory.md`.
 */
@Injectable()
export class MovimientosService {
  constructor(
    private readonly movimientoRepository: MovimientoStockRepository,
    private readonly tipoMovimientoRepository: TipoMovimientoStockRepository,
    private readonly productoLookupRepository: ProductoLookupRepository,
    private readonly almacenRepository: AlmacenRepository,
    private readonly ubicacionRepository: UbicacionAlmacenRepository,
  ) {}

  async registrar(context: UserContext, input: RegistrarMovimientoInput): Promise<stock_movements> {
    const tipo = await this.tipoMovimientoRepository.findById(context, {
      id: input.movementTypeId,
    });
    if (!tipo) throw new TipoMovimientoInvalidoException(input.movementTypeId);
    const direction = tipo.direction as 'in' | 'out';

    new MovimientoStock(
      input.productId,
      input.warehouseId,
      input.movementTypeId,
      input.quantity,
      input.unitCost ?? null,
      input.sourceModule ?? null,
      input.sourceEntityId ?? null,
    ); // valida invariantes antes de tocar la base

    const productoValido = await this.productoLookupRepository.existeProducto(
      context,
      input.productId,
    );
    if (!productoValido) throw new ProductoInvalidoException(input.productId);

    const almacen = await this.almacenRepository.findById(context, { id: input.warehouseId });
    if (!almacen) throw new AlmacenInvalidoException(input.warehouseId);

    if (input.locationId) {
      const ubicacion = await this.ubicacionRepository.findById(context, {
        id: input.locationId,
      });
      if (!ubicacion) throw new UbicacionInvalidaException(input.locationId);
    }

    try {
      const { movimiento } = await this.movimientoRepository.registrar(context, {
        companyId: almacen.company_id,
        branchId: almacen.branch_id,
        productId: input.productId,
        warehouseId: input.warehouseId,
        locationId: input.locationId ?? null,
        movementTypeId: input.movementTypeId,
        direction,
        quantity: input.quantity,
        unitCost: input.unitCost ?? null,
        sourceModule: input.sourceModule ?? null,
        sourceEntityId: input.sourceEntityId ?? null,
        observations: input.observations ?? null,
      });
      return movimiento;
    } catch (error) {
      if (error instanceof StockInsuficienteError) {
        throw new StockInsuficienteException(error.disponible, error.solicitado);
      }
      throw error;
    }
  }

  async listar(
    context: UserContext,
    filter: InventoryPrisma.stock_movementsWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<stock_movements>> {
    return this.movimientoRepository.listar(context, filter, pagination);
  }
}
