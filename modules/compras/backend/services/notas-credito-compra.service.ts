import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { purchase_credit_notes } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import {
  NotaCreditoCompraRepository,
  type LineaNotaCreditoCompraParams,
  type NotaCreditoCompraConLineas,
} from '../repositories/nota-credito-compra.repository';
import { FacturaCompraRepository } from '../repositories/factura-compra.repository';
import { EstadoFacturaCompraRepository } from '../repositories/estado-factura-compra.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import { NotaCreditoCompra } from '../entities/nota-credito-compra.entity';
import type {
  CrearNotaCreditoCompraInput,
  ActualizarNotaCreditoCompraInput,
} from '../validators/notas-credito-compra.schema';

export class NotaCreditoCompraNoEncontradaException extends DomainException {
  constructor(id: string) {
    super('NOTA_CREDITO_COMPRA_NO_ENCONTRADA', `No existe la nota de crédito "${id}".`, 404);
  }
}

export class NotaCreditoCompraInvalidaException extends DomainException {
  constructor(mensaje: string) {
    super('NOTA_CREDITO_COMPRA_INVALIDA', mensaje, 400);
  }
}

export class FacturaNoValidaParaNotaCreditoException extends DomainException {
  constructor(purchaseInvoiceId: string) {
    super(
      'FACTURA_NO_VALIDA_PARA_NOTA_CREDITO',
      `La factura de compra "${purchaseInvoiceId}" está cancelada — no admite notas de crédito.`,
      409,
    );
  }
}

export class CantidadExcedeFacturaException extends DomainException {
  constructor(productId: string, facturado: number, yaAcreditado: number, intentado: number) {
    super(
      'CANTIDAD_EXCEDE_FACTURA',
      `El producto "${productId}" excede la cantidad facturada: facturado ${facturado}, ya acreditado ${yaAcreditado}, se intenta acreditar ${intentado}.`,
      409,
    );
  }
}

function construirNota(
  id: string,
  companyId: string,
  purchaseInvoiceId: string,
  totalAmount: number,
  lines: Array<{ productId: string; quantity: number }>,
): void {
  try {
    new NotaCreditoCompra(id, companyId, purchaseInvoiceId, totalAmount, lines);
  } catch (error) {
    throw new NotaCreditoCompraInvalidaException(
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Notas de Crédito de Compra (`purchases.purchase_credit_notes`/
 * `purchase_credit_note_lines`) — Compras FASE 9. Mismo criterio sin
 * estado que Purchase Returns ([[ADR-PUR-004]] extendido). Reutiliza
 * `FacturaCompraRepository`/`EstadoFacturaCompraRepository`/
 * `ProductoLookupRepository` ya existentes en el módulo — el monto total
 * se deriva del `unit_cost` de la línea de factura correspondiente
 * (misma fuente que usa `CotejosCompraService`), nunca de un precio
 * propio de la nota (el schema no tiene esa columna).
 */
@Injectable()
export class NotasCreditoCompraService {
  constructor(
    private readonly notaCreditoCompraRepository: NotaCreditoCompraRepository,
    private readonly facturaCompraRepository: FacturaCompraRepository,
    private readonly estadoFacturaCompraRepository: EstadoFacturaCompraRepository,
    private readonly productoLookupRepository: ProductoLookupRepository,
  ) {}

  private async validarFacturaYLineas(
    context: UserContext,
    purchaseInvoiceId: string,
    lines: Array<{ productId: string; quantity: number }>,
    excludingCreditNoteId?: string,
  ) {
    const factura = await this.facturaCompraRepository.obtener(context, purchaseInvoiceId);
    if (!factura) {
      throw new NotaCreditoCompraInvalidaException(
        `No existe la factura de compra "${purchaseInvoiceId}".`,
      );
    }

    const estado = await this.estadoFacturaCompraRepository.findById(context, {
      id: factura.status_id,
    });
    if (estado?.code === 'cancelled') {
      throw new FacturaNoValidaParaNotaCreditoException(purchaseInvoiceId);
    }

    let totalAmount = 0;
    for (const linea of lines) {
      const lineaFactura = factura.purchase_invoice_lines.find(
        (l) => l.product_id === linea.productId,
      );
      if (!lineaFactura) {
        throw new NotaCreditoCompraInvalidaException(
          `El producto "${linea.productId}" no está incluido en la factura de compra "${purchaseInvoiceId}".`,
        );
      }

      const productoValido = await this.productoLookupRepository.existeProducto(
        context,
        linea.productId,
      );
      if (!productoValido) {
        throw new NotaCreditoCompraInvalidaException(`No existe el producto "${linea.productId}".`);
      }

      const yaAcreditado = await this.notaCreditoCompraRepository.sumarCantidadAcreditada(
        context,
        purchaseInvoiceId,
        linea.productId,
        excludingCreditNoteId,
      );
      const facturado = Number(lineaFactura.quantity);
      if (yaAcreditado + linea.quantity > facturado) {
        throw new CantidadExcedeFacturaException(
          linea.productId,
          facturado,
          yaAcreditado,
          linea.quantity,
        );
      }

      totalAmount += linea.quantity * Number(lineaFactura.unit_cost);
    }

    return { factura, totalAmount: Number(totalAmount.toFixed(4)) };
  }

  async crear(
    context: UserContext,
    input: CrearNotaCreditoCompraInput,
  ): Promise<NotaCreditoCompraConLineas> {
    const { factura, totalAmount } = await this.validarFacturaYLineas(
      context,
      input.purchaseInvoiceId,
      input.lines,
    );
    construirNota(
      'pendiente',
      factura.company_id,
      input.purchaseInvoiceId,
      totalAmount,
      input.lines,
    );

    const lines: LineaNotaCreditoCompraParams[] = input.lines.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
    }));

    return this.notaCreditoCompraRepository.crear(context, {
      companyId: factura.company_id,
      branchId: factura.branch_id,
      purchaseInvoiceId: input.purchaseInvoiceId,
      totalAmount,
      lines,
    });
  }

  async obtener(context: UserContext, id: string): Promise<NotaCreditoCompraConLineas> {
    const nota = await this.notaCreditoCompraRepository.obtener(context, id);
    if (!nota) throw new NotaCreditoCompraNoEncontradaException(id);
    return nota;
  }

  async listar(
    context: UserContext,
    filtros: { companyId: string; purchaseInvoiceId?: string },
    pagination: PaginationParams,
  ): Promise<PaginatedResult<purchase_credit_notes>> {
    return this.notaCreditoCompraRepository.listar(
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
    input: ActualizarNotaCreditoCompraInput,
  ): Promise<NotaCreditoCompraConLineas> {
    const actual = await this.obtener(context, id);

    const { totalAmount } = await this.validarFacturaYLineas(
      context,
      actual.purchase_invoice_id,
      input.lines,
      id,
    );
    construirNota(
      actual.id,
      actual.company_id,
      actual.purchase_invoice_id,
      totalAmount,
      input.lines,
    );

    const lines: LineaNotaCreditoCompraParams[] = input.lines.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
    }));
    return this.notaCreditoCompraRepository.actualizar(context, id, { totalAmount, lines });
  }

  async anular(context: UserContext, id: string): Promise<purchase_credit_notes> {
    await this.obtener(context, id);
    return this.notaCreditoCompraRepository.anular(context, id);
  }
}
