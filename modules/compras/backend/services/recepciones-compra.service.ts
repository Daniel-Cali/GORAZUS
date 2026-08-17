import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { goods_receipt_notes } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import {
  RecepcionCompraRepository,
  type LineaRecepcionCompraParams,
  type RecepcionCompraConLineas,
} from '../repositories/recepcion-compra.repository';
import { OrdenCompraRepository } from '../repositories/orden-compra.repository';
import { EstadoOrdenCompraRepository } from '../repositories/estado-orden-compra.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import { RecepcionCompra } from '../entities/recepcion-compra.entity';
import type {
  CrearRecepcionCompraInput,
  ActualizarRecepcionCompraInput,
} from '../validators/recepciones-compra.schema';

export class RecepcionCompraNoEncontradaException extends DomainException {
  constructor(id: string) {
    super('RECEPCION_COMPRA_NO_ENCONTRADA', `No existe la recepción de compra "${id}".`, 404);
  }
}

export class RecepcionCompraInvalidaException extends DomainException {
  constructor(mensaje: string) {
    super('RECEPCION_COMPRA_INVALIDA', mensaje, 400);
  }
}

export class OrdenNoValidaParaRecepcionException extends DomainException {
  constructor(purchaseOrderId: string, estadoActual: string) {
    super(
      'ORDEN_NO_VALIDA_PARA_RECEPCION',
      `La orden de compra "${purchaseOrderId}" no admite recepciones en su estado actual ("${estadoActual}") — debe estar "approved".`,
      409,
    );
  }
}

export class CantidadExcedeOrdenException extends DomainException {
  constructor(productId: string, ordenado: number, yaRecibido: number, intentado: number) {
    super(
      'CANTIDAD_EXCEDE_ORDEN',
      `El producto "${productId}" excede la cantidad ordenada: ordenado ${ordenado}, ya recibido ${yaRecibido}, se intenta recibir ${intentado}.`,
      409,
    );
  }
}

function construirRecepcion(
  id: string,
  companyId: string,
  purchaseOrderId: string,
  lines: Array<{ productId: string; quantity: number }>,
): void {
  try {
    new RecepcionCompra(id, companyId, purchaseOrderId, lines);
  } catch (error) {
    throw new RecepcionCompraInvalidaException(
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Recepciones de Compra (`purchases.goods_receipt_notes`/
 * `goods_receipt_note_lines`) — Compras FASE 5. **El schema real no
 * define `*_status`/`*_status_history` para este par de tablas** —
 * verificado en `schema.prisma`, distinto de lo asumido al iniciar la
 * fase. Sin flujo de estados: una recepción es un hecho consumado al
 * crearse; "anular" usa `deleted_at` (soft delete), no una transición de
 * catálogo.
 *
 * Integración con Inventario: **ninguna en esta fase**. Verificado que
 * `inventory.goods_receipts`/`goods_receipt_lines` (el movimiento físico
 * real, dueño Inventario) no tiene código de aplicación todavía
 * (`INVENTORY_NEXT_PHASE.md`) — no hay servicio real que reutilizar, y
 * escribir ahí directamente violaría la regla de un módulo dueño único
 * por Aggregate Root. `inventory_receipt_id` queda `null`; correlacionar
 * ambos lados es trabajo futuro de Inventario, no de esta fase.
 */
@Injectable()
export class RecepcionesCompraService {
  constructor(
    private readonly recepcionCompraRepository: RecepcionCompraRepository,
    private readonly ordenCompraRepository: OrdenCompraRepository,
    private readonly estadoOrdenCompraRepository: EstadoOrdenCompraRepository,
    private readonly productoLookupRepository: ProductoLookupRepository,
  ) {}

  private async validarOrdenYLineas(
    context: UserContext,
    purchaseOrderId: string,
    lines: Array<{ productId: string; quantity: number }>,
    excludingReceiptId?: string,
  ) {
    const orden = await this.ordenCompraRepository.obtener(context, purchaseOrderId);
    if (!orden) {
      throw new RecepcionCompraInvalidaException(
        `No existe la orden de compra "${purchaseOrderId}".`,
      );
    }

    const estado = await this.estadoOrdenCompraRepository.findById(context, {
      id: orden.status_id,
    });
    if (estado?.code !== 'approved') {
      throw new OrdenNoValidaParaRecepcionException(purchaseOrderId, estado?.code ?? '');
    }

    for (const linea of lines) {
      const lineaOrden = orden.purchase_order_lines.find((l) => l.product_id === linea.productId);
      if (!lineaOrden) {
        throw new RecepcionCompraInvalidaException(
          `El producto "${linea.productId}" no está incluido en la orden de compra "${purchaseOrderId}".`,
        );
      }

      const productoValido = await this.productoLookupRepository.existeProducto(
        context,
        linea.productId,
      );
      if (!productoValido) {
        throw new RecepcionCompraInvalidaException(`No existe el producto "${linea.productId}".`);
      }

      const yaRecibido = await this.recepcionCompraRepository.sumarCantidadRecibida(
        context,
        purchaseOrderId,
        linea.productId,
        excludingReceiptId,
      );
      const ordenado = Number(lineaOrden.quantity);
      if (yaRecibido + linea.quantity > ordenado) {
        throw new CantidadExcedeOrdenException(
          linea.productId,
          ordenado,
          yaRecibido,
          linea.quantity,
        );
      }
    }

    return orden;
  }

  async crear(
    context: UserContext,
    input: CrearRecepcionCompraInput,
  ): Promise<RecepcionCompraConLineas> {
    // ISSUE-07: replay con la misma clave — devuelve el resultado original
    // tal cual, sin volver a correr `validarOrdenYLineas` (que podría
    // rechazar el replay si el estado de la orden cambió desde la primera
    // vez) ni tocar stock/recepción de nuevo. La ventana de carrera real
    // (dos solicitudes concurrentes con la misma clave llegando aquí a la
    // vez) la cierra `RecepcionCompraRepositoryPrisma.crear` con el índice
    // único parcial + catch de P2002, no este lookup.
    if (input.idempotencyKey) {
      const existente = await this.recepcionCompraRepository.obtenerPorIdempotencyKey(
        context,
        input.idempotencyKey,
      );
      if (existente) return existente;
    }

    const orden = await this.validarOrdenYLineas(context, input.purchaseOrderId, input.lines);
    construirRecepcion('pendiente', orden.company_id, input.purchaseOrderId, input.lines);

    const lines: LineaRecepcionCompraParams[] = input.lines.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
    }));

    return this.recepcionCompraRepository.crear(context, {
      companyId: orden.company_id,
      branchId: orden.branch_id,
      purchaseOrderId: input.purchaseOrderId,
      lines,
      idempotencyKey: input.idempotencyKey ?? null,
    });
  }

  async obtener(context: UserContext, id: string): Promise<RecepcionCompraConLineas> {
    const recepcion = await this.recepcionCompraRepository.obtener(context, id);
    if (!recepcion) throw new RecepcionCompraNoEncontradaException(id);
    return recepcion;
  }

  async listar(
    context: UserContext,
    filtros: {
      companyId: string;
      purchaseOrderId?: string;
      fromDate?: Date;
      toDate?: Date;
    },
    pagination: PaginationParams,
  ): Promise<PaginatedResult<goods_receipt_notes>> {
    return this.recepcionCompraRepository.listar(
      context,
      {
        company_id: filtros.companyId,
        ...(filtros.purchaseOrderId ? { purchase_order_id: filtros.purchaseOrderId } : {}),
        ...(filtros.fromDate || filtros.toDate
          ? {
              created_at: {
                ...(filtros.fromDate ? { gte: filtros.fromDate } : {}),
                ...(filtros.toDate ? { lte: filtros.toDate } : {}),
              },
            }
          : {}),
      },
      pagination,
    );
  }

  async actualizar(
    context: UserContext,
    id: string,
    input: ActualizarRecepcionCompraInput,
  ): Promise<RecepcionCompraConLineas> {
    const actual = await this.obtener(context, id);

    await this.validarOrdenYLineas(context, actual.purchase_order_id, input.lines, id);
    construirRecepcion(actual.id, actual.company_id, actual.purchase_order_id, input.lines);

    const lines: LineaRecepcionCompraParams[] = input.lines.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
    }));
    return this.recepcionCompraRepository.actualizar(context, id, { lines });
  }

  async anular(context: UserContext, id: string): Promise<goods_receipt_notes> {
    await this.obtener(context, id);
    return this.recepcionCompraRepository.anular(context, id);
  }
}
