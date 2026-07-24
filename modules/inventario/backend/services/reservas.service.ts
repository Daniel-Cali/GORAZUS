import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { InventoryPrisma, stock_reservations } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import {
  ReservaStockRepository,
  CapacidadReservaInsuficienteError,
  ReservaYaLiberadaError,
  ReservaNoEncontradaError,
} from '../repositories/reserva-stock.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import { AlmacenRepository } from '../repositories/almacen.repository';
import { ReservaStock } from '../entities/reserva-stock.entity';
import type { CrearReservaInput } from '../validators/reservas.schema';
import { ProductoInvalidoException, AlmacenInvalidoException } from './movimientos.service';

export class ReservaNoEncontradaException extends DomainException {
  constructor(id: string) {
    super('RESERVA_NO_ENCONTRADA', `No existe la reserva "${id}".`, 404);
  }
}

export class ReservaYaLiberadaException extends DomainException {
  constructor(id: string) {
    super('RESERVA_YA_LIBERADA', `La reserva "${id}" ya fue liberada.`, 409);
  }
}

export class CapacidadReservaInsuficienteException extends DomainException {
  constructor(disponible: number, solicitado: number) {
    super(
      'CAPACIDAD_RESERVA_INSUFICIENTE',
      `Capacidad de reserva insuficiente: disponible ${disponible}, solicitado ${solicitado}.`,
      409,
    );
  }
}

/**
 * Reservas de stock (`inventory.stock_reservations`) — "comprometido"
 * del pedido de `INVENTORY_ARCHITECTURE.md §2`. Opera sobre el registro
 * de stock sin ubicación asignada (`location_id IS NULL`), ver el
 * comentario de cabecera de `ReservaStockRepository`.
 */
@Injectable()
export class ReservasService {
  constructor(
    private readonly reservaRepository: ReservaStockRepository,
    private readonly productoLookupRepository: ProductoLookupRepository,
    private readonly almacenRepository: AlmacenRepository,
  ) {}

  async crear(context: UserContext, input: CrearReservaInput): Promise<stock_reservations> {
    new ReservaStock(
      input.productId,
      input.warehouseId,
      input.quantity,
      input.sourceModule,
      input.sourceEntityId,
    ); // valida invariantes antes de tocar la base

    const productoValido = await this.productoLookupRepository.existeProducto(
      context,
      input.productId,
    );
    if (!productoValido) throw new ProductoInvalidoException(input.productId);

    const almacen = await this.almacenRepository.findById(context, { id: input.warehouseId });
    if (!almacen) throw new AlmacenInvalidoException(input.warehouseId);

    try {
      return await this.reservaRepository.crear(context, {
        companyId: almacen.company_id,
        branchId: almacen.branch_id,
        productId: input.productId,
        warehouseId: input.warehouseId,
        quantity: input.quantity,
        sourceModule: input.sourceModule,
        sourceEntityId: input.sourceEntityId,
        observations: input.observations ?? null,
      });
    } catch (error) {
      if (error instanceof CapacidadReservaInsuficienteError) {
        throw new CapacidadReservaInsuficienteException(error.disponible, error.solicitado);
      }
      throw error;
    }
  }

  async liberar(context: UserContext, id: string): Promise<stock_reservations> {
    try {
      return await this.reservaRepository.liberar(context, id);
    } catch (error) {
      if (error instanceof ReservaNoEncontradaError) throw new ReservaNoEncontradaException(id);
      if (error instanceof ReservaYaLiberadaError) throw new ReservaYaLiberadaException(id);
      throw error;
    }
  }

  async obtener(context: UserContext, id: string): Promise<stock_reservations> {
    const reserva = await this.reservaRepository.obtener(context, id);
    if (!reserva) throw new ReservaNoEncontradaException(id);
    return reserva;
  }

  async listar(
    context: UserContext,
    filter: InventoryPrisma.stock_reservationsWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<stock_reservations>> {
    return this.reservaRepository.listar(context, filter, pagination);
  }
}
