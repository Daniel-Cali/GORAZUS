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
  SerieYaReservadaError,
} from '../repositories/reserva-stock.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import { AlmacenRepository } from '../repositories/almacen.repository';
import { InventoryLotRepository } from '../repositories/inventory-lot.repository';
import { InventorySerialRepository } from '../repositories/inventory-serial.repository';
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

export class LoteInvalidoException extends DomainException {
  constructor(motivo: 'no_existe' | 'producto_no_coincide' | 'sin_disponibilidad') {
    const mensajes = {
      no_existe: 'El lote indicado no existe.',
      producto_no_coincide: 'El lote indicado no pertenece al producto de esta reserva.',
      sin_disponibilidad: 'El lote indicado no tiene disponibilidad suficiente.',
    };
    super('LOTE_INVALIDO', mensajes[motivo], 409);
  }
}

export class SerieInvalidaException extends DomainException {
  constructor(
    motivo: 'no_existe' | 'producto_no_coincide' | 'no_disponible' | 'cantidad_invalida',
  ) {
    const mensajes = {
      no_existe: 'La serie indicada no existe.',
      producto_no_coincide: 'La serie indicada no pertenece al producto de esta reserva.',
      no_disponible: 'La serie indicada no está disponible (ya fue emitida).',
      cantidad_invalida: 'Una reserva de una serie debe tener cantidad exactamente 1.',
    };
    super('SERIE_INVALIDA', mensajes[motivo], 409);
  }
}

export class SerieYaReservadaException extends DomainException {
  constructor(serialNumber: string) {
    super(
      'SERIE_YA_RESERVADA',
      `La serie "${serialNumber}" ya tiene una reserva activa — no se puede reservar dos veces.`,
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
    private readonly inventoryLotRepository: InventoryLotRepository,
    private readonly inventorySerialRepository: InventorySerialRepository,
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

    const control = await this.productoLookupRepository.obtenerControl(context, input.productId);
    let lotId: string | null = null;
    let serialId: string | null = null;

    if (control?.tracksLot && input.lotId) {
      const lote = await this.inventoryLotRepository.obtenerPorId(context, input.lotId);
      if (!lote) throw new LoteInvalidoException('no_existe');
      if (lote.product_id !== input.productId)
        throw new LoteInvalidoException('producto_no_coincide');
      if (Number(lote.remaining_quantity) < input.quantity) {
        throw new LoteInvalidoException('sin_disponibilidad');
      }
      lotId = input.lotId;
    }

    if (control?.tracksSerial && input.serialNumber) {
      if (input.quantity !== 1) throw new SerieInvalidaException('cantidad_invalida');
      const serie = await this.inventorySerialRepository.obtenerPorNumero(
        context,
        input.serialNumber,
      );
      if (!serie) throw new SerieInvalidaException('no_existe');
      if (serie.product_id !== input.productId)
        throw new SerieInvalidaException('producto_no_coincide');
      if (serie.status !== 'in_stock') throw new SerieInvalidaException('no_disponible');
      serialId = serie.id;
    }

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
        lotId,
        serialId,
      });
    } catch (error) {
      if (error instanceof CapacidadReservaInsuficienteError) {
        throw new CapacidadReservaInsuficienteException(error.disponible, error.solicitado);
      }
      if (error instanceof SerieYaReservadaError) {
        throw new SerieYaReservadaException(input.serialNumber ?? '');
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
