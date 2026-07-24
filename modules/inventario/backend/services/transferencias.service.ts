import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { InventoryPrisma, stock_transfers } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import {
  TransferenciaRepository,
  type TransferenciaConLineas,
} from '../repositories/transferencia.repository';
import { TipoMovimientoStockRepository } from '../repositories/tipo-movimiento-stock.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import { AlmacenRepository } from '../repositories/almacen.repository';
import {
  MovimientosService,
  ProductoInvalidoException,
  AlmacenInvalidoException,
} from './movimientos.service';
import {
  Transferencia,
  TRANSICIONES_TRANSFERENCIA,
  type EstadoTransferencia,
} from '../entities/transferencia.entity';
import type { RegistrarMovimientoInput } from '../validators/movimientos.schema';
import type { CrearTransferenciaInput } from '../validators/transferencias.schema';

const SOURCE_MODULE_TRANSFERENCIAS = 'inventario.transferencias';

export class TransferenciaNoEncontradaException extends DomainException {
  constructor(id: string) {
    super('TRANSFERENCIA_NO_ENCONTRADA', `No existe la transferencia "${id}".`, 404);
  }
}

export class TransicionTransferenciaInvalidaException extends DomainException {
  constructor(estadoActual: string, destino: string) {
    super(
      'TRANSICION_TRANSFERENCIA_INVALIDA',
      `No se puede pasar la transferencia de "${estadoActual}" a "${destino}".`,
      409,
    );
  }
}

export class TipoMovimientoTransferenciaNoConfiguradoException extends DomainException {
  constructor(code: string) {
    super(
      'TIPO_MOVIMIENTO_TRANSFERENCIA_NO_CONFIGURADO',
      `No existe el tipo de movimiento "${code}" para este tenant — correr scripts/seed-stock-movement-types.ts primero.`,
      409,
    );
  }
}

/**
 * Transferencias entre almacenes (`inventory.stock_transfers` +
 * `stock_transfer_lines`) — orquesta el motor de movimientos
 * (`MovimientosService`), nunca toca `inventory.stock` directo
 * (`INVENTORY_ARCHITECTURE.md §6`). Flujo de estados: `draft →
 * in_transit` genera `transfer_out` en el almacén origen (lote atómico,
 * una línea o ninguna); `in_transit → received` genera `transfer_in` en
 * el destino; `draft → cancelled` no genera movimientos. Cualquier otra
 * transición es rechazada (`TRANSICIONES_TRANSFERENCIA`).
 */
@Injectable()
export class TransferenciasService {
  constructor(
    private readonly transferenciaRepository: TransferenciaRepository,
    private readonly almacenRepository: AlmacenRepository,
    private readonly productoLookupRepository: ProductoLookupRepository,
    private readonly tipoMovimientoRepository: TipoMovimientoStockRepository,
    private readonly movimientosService: MovimientosService,
  ) {}

  async crear(
    context: UserContext,
    input: CrearTransferenciaInput,
  ): Promise<TransferenciaConLineas> {
    new Transferencia(
      'pendiente',
      input.sourceWarehouseId,
      input.destinationWarehouseId,
      input.documentNumber,
      input.lines,
    ); // valida invariantes antes de tocar la base

    const origen = await this.almacenRepository.findById(context, { id: input.sourceWarehouseId });
    if (!origen) throw new AlmacenInvalidoException(input.sourceWarehouseId);
    const destino = await this.almacenRepository.findById(context, {
      id: input.destinationWarehouseId,
    });
    if (!destino) throw new AlmacenInvalidoException(input.destinationWarehouseId);

    for (const linea of input.lines) {
      const productoValido = await this.productoLookupRepository.existeProducto(
        context,
        linea.productId,
      );
      if (!productoValido) throw new ProductoInvalidoException(linea.productId);
    }

    return this.transferenciaRepository.crear(context, {
      companyId: origen.company_id,
      branchId: origen.branch_id,
      sourceWarehouseId: input.sourceWarehouseId,
      destinationWarehouseId: input.destinationWarehouseId,
      documentNumber: input.documentNumber,
      lines: input.lines,
    });
  }

  async obtener(context: UserContext, id: string): Promise<TransferenciaConLineas> {
    const transferencia = await this.transferenciaRepository.obtener(context, id);
    if (!transferencia) throw new TransferenciaNoEncontradaException(id);
    return transferencia;
  }

  async listar(
    context: UserContext,
    filter: InventoryPrisma.stock_transfersWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<stock_transfers>> {
    return this.transferenciaRepository.listar(context, filter, pagination);
  }

  async iniciar(context: UserContext, id: string): Promise<stock_transfers> {
    const transferencia = await this.obtener(context, id);
    this.validarTransicion(transferencia.status, 'in_transit');
    const movementTypeId = await this.resolverTipoPorCodigo(context, 'transfer_out');

    const inputs: RegistrarMovimientoInput[] = transferencia.stock_transfer_lines.map((linea) => ({
      productId: linea.product_id,
      warehouseId: transferencia.source_warehouse_id,
      movementTypeId,
      quantity: Number(linea.quantity),
      sourceModule: SOURCE_MODULE_TRANSFERENCIAS,
      sourceEntityId: transferencia.id,
    }));
    await this.movimientosService.registrarLote(context, inputs);

    return this.transferenciaRepository.actualizarEstado(context, id, 'in_transit');
  }

  async recibir(context: UserContext, id: string): Promise<stock_transfers> {
    const transferencia = await this.obtener(context, id);
    this.validarTransicion(transferencia.status, 'received');
    const movementTypeId = await this.resolverTipoPorCodigo(context, 'transfer_in');

    const inputs: RegistrarMovimientoInput[] = transferencia.stock_transfer_lines.map((linea) => ({
      productId: linea.product_id,
      warehouseId: transferencia.destination_warehouse_id,
      movementTypeId,
      quantity: Number(linea.quantity),
      sourceModule: SOURCE_MODULE_TRANSFERENCIAS,
      sourceEntityId: transferencia.id,
    }));
    await this.movimientosService.registrarLote(context, inputs);

    return this.transferenciaRepository.actualizarEstado(context, id, 'received');
  }

  async cancelar(context: UserContext, id: string): Promise<stock_transfers> {
    const transferencia = await this.obtener(context, id);
    this.validarTransicion(transferencia.status, 'cancelled');
    return this.transferenciaRepository.actualizarEstado(context, id, 'cancelled');
  }

  private validarTransicion(estadoActual: string, destino: EstadoTransferencia): void {
    const permitidas = TRANSICIONES_TRANSFERENCIA[estadoActual] ?? [];
    if (!permitidas.includes(destino)) {
      throw new TransicionTransferenciaInvalidaException(estadoActual, destino);
    }
  }

  private async resolverTipoPorCodigo(context: UserContext, code: string): Promise<string> {
    const resultado = await this.tipoMovimientoRepository.findMany(
      context,
      { code } as InventoryPrisma.stock_movement_typesWhereInput,
      { page: 1, pageSize: 1 },
    );
    const tipo = resultado.data[0];
    if (!tipo) throw new TipoMovimientoTransferenciaNoConfiguradoException(code);
    return tipo.id;
  }
}
