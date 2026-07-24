import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { stock_movement_types } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { TipoMovimientoStockRepository } from '../repositories/tipo-movimiento-stock.repository';
import { TipoMovimientoStock } from '../entities/tipo-movimiento-stock.entity';
import type {
  CrearTipoMovimientoInput,
  ActualizarTipoMovimientoInput,
} from '../validators/tipos-movimiento.schema';

export class TipoMovimientoNoEncontradoException extends DomainException {
  constructor(id: string) {
    super('TIPO_MOVIMIENTO_NO_ENCONTRADO', `No existe el tipo de movimiento "${id}".`, 404);
  }
}

export class TipoMovimientoDuplicadoException extends DomainException {
  constructor(code: string) {
    super(
      'TIPO_MOVIMIENTO_DUPLICADO',
      `Ya existe un tipo de movimiento con el código "${code}".`,
      409,
    );
  }
}

export class TipoMovimientoConMovimientosException extends DomainException {
  constructor(id: string) {
    super(
      'TIPO_MOVIMIENTO_CON_MOVIMIENTOS',
      `No se puede cambiar la dirección del tipo de movimiento "${id}": ya tiene movimientos registrados (cambiarla corrompería el kardex histórico).`,
      409,
    );
  }
}

/**
 * Catálogo de tipos de movimiento (`inventory.stock_movement_types`) —
 * agregar un tipo nuevo es una fila, no una migración
 * (`INVENTORY_ARCHITECTURE.md §6`). Sin `eliminar`: un tipo referenciado
 * por movimientos históricos no puede desaparecer.
 */
@Injectable()
export class TiposMovimientoService {
  constructor(private readonly tipoMovimientoRepository: TipoMovimientoStockRepository) {}

  async crear(
    context: UserContext,
    input: CrearTipoMovimientoInput,
  ): Promise<stock_movement_types> {
    new TipoMovimientoStock('pendiente', input.code, input.direction); // valida invariantes antes de tocar la base

    const duplicado = await this.tipoMovimientoRepository.existeCodigo(context, input.code);
    if (duplicado) throw new TipoMovimientoDuplicadoException(input.code);

    return this.tipoMovimientoRepository.create(context, {
      tenant_id: context.tenantId,
      code: input.code,
      direction: input.direction,
    });
  }

  async listar(
    context: UserContext,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<stock_movement_types>> {
    return this.tipoMovimientoRepository.findMany(context, {}, pagination);
  }

  async obtener(context: UserContext, id: string): Promise<stock_movement_types> {
    const tipo = await this.tipoMovimientoRepository.findById(context, { id });
    if (!tipo) throw new TipoMovimientoNoEncontradoException(id);
    return tipo;
  }

  /**
   * Get-or-create idempotente del tipo de movimiento por código — mismo
   * patrón que `CajaService.resolverTipoPorCodigo`/`VentasService.resolverEstadoPorCodigo`.
   * Primer consumidor: `modules/pos/backend` (checkout — resuelve
   * "salida por venta" sin depender de que alguien lo cree a mano antes,
   * `POS_ARCHITECTURE.md §4.3`).
   */
  async resolverPorCodigo(
    context: UserContext,
    code: string,
    direction: 'in' | 'out',
  ): Promise<string> {
    const existente = await this.tipoMovimientoRepository.findMany(
      context,
      { code },
      { page: 1, pageSize: 1 },
    );
    if (existente.data[0]) return existente.data[0].id;

    try {
      const creado = await this.tipoMovimientoRepository.create(context, {
        tenant_id: context.tenantId,
        code,
        direction,
      });
      return creado.id;
    } catch (error) {
      const esViolacionDeUnicidad =
        typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
      if (!esViolacionDeUnicidad) throw error;
      const reintento = await this.tipoMovimientoRepository.findMany(
        context,
        { code },
        { page: 1, pageSize: 1 },
      );
      if (!reintento.data[0]) throw error;
      return reintento.data[0].id;
    }
  }

  async actualizar(
    context: UserContext,
    id: string,
    input: ActualizarTipoMovimientoInput,
  ): Promise<stock_movement_types> {
    const actual = await this.obtener(context, id);

    if (input.direction !== undefined && input.direction !== actual.direction) {
      const tieneMovimientos = await this.tipoMovimientoRepository.tieneMovimientos(context, id);
      if (tieneMovimientos) throw new TipoMovimientoConMovimientosException(id);
    }

    if (input.code !== undefined && input.code !== actual.code) {
      const duplicado = await this.tipoMovimientoRepository.existeCodigo(context, input.code);
      if (duplicado) throw new TipoMovimientoDuplicadoException(input.code);
    }

    return this.tipoMovimientoRepository.update(
      context,
      { id },
      {
        ...(input.code !== undefined && { code: input.code }),
        ...(input.direction !== undefined && { direction: input.direction }),
      },
    );
  }
}
