import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { stock_movements, inventory_serials } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { InventorySerialRepository } from '../repositories/inventory-serial.repository';
import { MovimientosService } from './movimientos.service';

export class SerieNoEncontradaException extends DomainException {
  constructor(serialNumber: string) {
    super('SERIE_NO_ENCONTRADA', `No existe la serie "${serialNumber}".`, 404);
  }
}

/**
 * Inventario Parte 05, Subfase 3 — consultas de trazabilidad de series
 * ("Find serial history": Recepción → Almacén → Transferencia → Venta).
 * Solo lectura: la creación/emisión de series vive en
 * `RecepcionesInventarioService`/`SalidasInventarioService`. El historial
 * se arma leyendo `stock_movements.serial_id` vía `MovimientosService` —
 * cada movimiento ya trae `source_module`/`movement_type_id`, suficiente
 * para reconstruir la cadena sin tabla nueva.
 */
@Injectable()
export class SeriesInventarioService {
  constructor(
    private readonly inventorySerialRepository: InventorySerialRepository,
    private readonly movimientosService: MovimientosService,
  ) {}

  async obtenerPorNumero(context: UserContext, serialNumber: string): Promise<inventory_serials> {
    const serie = await this.inventorySerialRepository.obtenerPorNumero(context, serialNumber);
    if (!serie) throw new SerieNoEncontradaException(serialNumber);
    return serie;
  }

  async obtenerHistorial(
    context: UserContext,
    serialNumber: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<stock_movements>> {
    const serie = await this.obtenerPorNumero(context, serialNumber);
    return this.movimientosService.listar(context, { serial_id: serie.id }, pagination);
  }
}
