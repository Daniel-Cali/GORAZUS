import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { purchase_returns } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import {
  DevolucionCompraRepository,
  type LineaDevolucionCompraParams,
  type DevolucionCompraConLineas,
} from '../repositories/devolucion-compra.repository';
import { FacturaCompraRepository } from '../repositories/factura-compra.repository';
import { EstadoFacturaCompraRepository } from '../repositories/estado-factura-compra.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import { DevolucionCompra } from '../entities/devolucion-compra.entity';
import type {
  CrearDevolucionCompraInput,
  ActualizarDevolucionCompraInput,
} from '../validators/devoluciones-compra.schema';

export class DevolucionCompraNoEncontradaException extends DomainException {
  constructor(id: string) {
    super('DEVOLUCION_COMPRA_NO_ENCONTRADA', `No existe la devolución de compra "${id}".`, 404);
  }
}

export class DevolucionCompraInvalidaException extends DomainException {
  constructor(mensaje: string) {
    super('DEVOLUCION_COMPRA_INVALIDA', mensaje, 400);
  }
}

export class FacturaNoValidaParaDevolucionException extends DomainException {
  constructor(purchaseInvoiceId: string) {
    super(
      'FACTURA_NO_VALIDA_PARA_DEVOLUCION',
      `La factura de compra "${purchaseInvoiceId}" está cancelada — no admite devoluciones.`,
      409,
    );
  }
}

export class CantidadExcedeFacturaException extends DomainException {
  constructor(productId: string, facturado: number, yaDevuelto: number, intentado: number) {
    super(
      'CANTIDAD_EXCEDE_FACTURA',
      `El producto "${productId}" excede la cantidad facturada: facturado ${facturado}, ya devuelto ${yaDevuelto}, se intenta devolver ${intentado}.`,
      409,
    );
  }
}

function construirDevolucion(
  id: string,
  companyId: string,
  purchaseInvoiceId: string,
  lines: Array<{ productId: string; quantity: number }>,
): void {
  try {
    new DevolucionCompra(id, companyId, purchaseInvoiceId, lines);
  } catch (error) {
    throw new DevolucionCompraInvalidaException(
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Devoluciones de Compra (`purchases.purchase_returns`/
 * `purchase_return_lines`) — Compras FASE 8. Mismo criterio que Goods
 * Receipt ([[ADR-PUR-004]]): sin `*_status`/`*_status_history` en el
 * schema real, sin flujo de estados — "anular" usa `deleted_at`.
 * Reutiliza `FacturaCompraRepository`/`EstadoFacturaCompraRepository`/
 * `ProductoLookupRepository` ya existentes en el módulo, sin duplicar
 * lógica.
 */
@Injectable()
export class DevolucionesCompraService {
  constructor(
    private readonly devolucionCompraRepository: DevolucionCompraRepository,
    private readonly facturaCompraRepository: FacturaCompraRepository,
    private readonly estadoFacturaCompraRepository: EstadoFacturaCompraRepository,
    private readonly productoLookupRepository: ProductoLookupRepository,
  ) {}

  private async validarFacturaYLineas(
    context: UserContext,
    purchaseInvoiceId: string,
    lines: Array<{ productId: string; quantity: number }>,
    excludingReturnId?: string,
  ) {
    const factura = await this.facturaCompraRepository.obtener(context, purchaseInvoiceId);
    if (!factura) {
      throw new DevolucionCompraInvalidaException(
        `No existe la factura de compra "${purchaseInvoiceId}".`,
      );
    }

    const estado = await this.estadoFacturaCompraRepository.findById(context, {
      id: factura.status_id,
    });
    if (estado?.code === 'cancelled') {
      throw new FacturaNoValidaParaDevolucionException(purchaseInvoiceId);
    }

    for (const linea of lines) {
      const lineaFactura = factura.purchase_invoice_lines.find(
        (l) => l.product_id === linea.productId,
      );
      if (!lineaFactura) {
        throw new DevolucionCompraInvalidaException(
          `El producto "${linea.productId}" no está incluido en la factura de compra "${purchaseInvoiceId}".`,
        );
      }

      const productoValido = await this.productoLookupRepository.existeProducto(
        context,
        linea.productId,
      );
      if (!productoValido) {
        throw new DevolucionCompraInvalidaException(`No existe el producto "${linea.productId}".`);
      }

      const yaDevuelto = await this.devolucionCompraRepository.sumarCantidadDevuelta(
        context,
        purchaseInvoiceId,
        linea.productId,
        excludingReturnId,
      );
      const facturado = Number(lineaFactura.quantity);
      if (yaDevuelto + linea.quantity > facturado) {
        throw new CantidadExcedeFacturaException(
          linea.productId,
          facturado,
          yaDevuelto,
          linea.quantity,
        );
      }
    }

    return factura;
  }

  async crear(
    context: UserContext,
    input: CrearDevolucionCompraInput,
  ): Promise<DevolucionCompraConLineas> {
    const factura = await this.validarFacturaYLineas(context, input.purchaseInvoiceId, input.lines);
    construirDevolucion('pendiente', factura.company_id, input.purchaseInvoiceId, input.lines);

    const lines: LineaDevolucionCompraParams[] = input.lines.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
    }));

    return this.devolucionCompraRepository.crear(context, {
      companyId: factura.company_id,
      branchId: factura.branch_id,
      purchaseInvoiceId: input.purchaseInvoiceId,
      reason: input.reason ?? null,
      lines,
    });
  }

  async obtener(context: UserContext, id: string): Promise<DevolucionCompraConLineas> {
    const devolucion = await this.devolucionCompraRepository.obtener(context, id);
    if (!devolucion) throw new DevolucionCompraNoEncontradaException(id);
    return devolucion;
  }

  async listar(
    context: UserContext,
    filtros: { companyId: string; purchaseInvoiceId?: string },
    pagination: PaginationParams,
  ): Promise<PaginatedResult<purchase_returns>> {
    return this.devolucionCompraRepository.listar(
      context,
      {
        company_id: filtros.companyId,
        ...(filtros.purchaseInvoiceId ? { purchase_invoice_id: filtros.purchaseInvoiceId } : {}),
      },
      pagination,
    );
  }

  async actualizar(
    context: UserContext,
    id: string,
    input: ActualizarDevolucionCompraInput,
  ): Promise<DevolucionCompraConLineas> {
    const actual = await this.obtener(context, id);

    await this.validarFacturaYLineas(context, actual.purchase_invoice_id, input.lines, id);
    construirDevolucion(actual.id, actual.company_id, actual.purchase_invoice_id, input.lines);

    const lines: LineaDevolucionCompraParams[] = input.lines.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
    }));
    return this.devolucionCompraRepository.actualizar(context, id, { lines });
  }

  async anular(context: UserContext, id: string): Promise<purchase_returns> {
    await this.obtener(context, id);
    return this.devolucionCompraRepository.anular(context, id);
  }
}
