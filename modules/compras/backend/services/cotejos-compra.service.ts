import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { purchase_invoice_matching } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { CotejoCompraRepository } from '../repositories/cotejo-compra.repository';
import { OrdenCompraRepository } from '../repositories/orden-compra.repository';
import { RecepcionCompraRepository } from '../repositories/recepcion-compra.repository';
import { FacturaCompraRepository } from '../repositories/factura-compra.repository';
import { CotejoCompra } from '../entities/cotejo-compra.entity';
import type { EjecutarCotejoCompraInput } from '../validators/cotejos-compra.schema';

export class CotejoCompraNoEncontradoException extends DomainException {
  constructor(id: string) {
    super('COTEJO_COMPRA_NO_ENCONTRADO', `No existe el cotejo de compra "${id}".`, 404);
  }
}

export class CotejoCompraInvalidoException extends DomainException {
  constructor(mensaje: string) {
    super('COTEJO_COMPRA_INVALIDO', mensaje, 400);
  }
}

/**
 * Tolerancia por defecto: 2% del total de la factura. **Placeholder
 * documentado, no una regla de negocio confirmada** — no existe todavía
 * ninguna configuración real de tolerancia en el schema ni en el AKB;
 * cuando exista (perfil de tolerancia por empresa/proveedor), reemplaza
 * esta constante sin cambiar la forma del resultado persistido
 * (`discrepancy_amount`/`is_within_tolerance` ya existen en el schema
 * real, calculados aquí).
 */
const TOLERANCE_PERCENTAGE = 0.02;

/**
 * Cotejos de Compra (`purchases.purchase_invoice_matching`) — Compras
 * FASE 7 (Purchase Matching, 3-way match OC↔Recepción↔Factura). A
 * diferencia del resto de los aggregates de Compras, no crea un
 * documento nuevo en construcción — **calcula y persiste el resultado**
 * de cotejar tres documentos ya existentes de las fases anteriores.
 */
@Injectable()
export class CotejosCompraService {
  constructor(
    private readonly cotejoCompraRepository: CotejoCompraRepository,
    private readonly ordenCompraRepository: OrdenCompraRepository,
    private readonly recepcionCompraRepository: RecepcionCompraRepository,
    private readonly facturaCompraRepository: FacturaCompraRepository,
  ) {}

  async ejecutar(
    context: UserContext,
    input: EjecutarCotejoCompraInput,
  ): Promise<purchase_invoice_matching> {
    const orden = await this.ordenCompraRepository.obtener(context, input.purchaseOrderId);
    if (!orden) {
      throw new CotejoCompraInvalidoException(
        `No existe la orden de compra "${input.purchaseOrderId}".`,
      );
    }

    const recepcion = await this.recepcionCompraRepository.obtener(context, input.receiptNoteId);
    if (!recepcion) {
      throw new CotejoCompraInvalidoException(
        `No existe la recepción de compra "${input.receiptNoteId}".`,
      );
    }
    if (recepcion.purchase_order_id !== input.purchaseOrderId) {
      throw new CotejoCompraInvalidoException(
        `La recepción "${input.receiptNoteId}" no corresponde a la orden de compra "${input.purchaseOrderId}".`,
      );
    }

    const factura = await this.facturaCompraRepository.obtener(context, input.purchaseInvoiceId);
    if (!factura) {
      throw new CotejoCompraInvalidoException(
        `No existe la factura de compra "${input.purchaseInvoiceId}".`,
      );
    }
    if (factura.purchase_order_id && factura.purchase_order_id !== input.purchaseOrderId) {
      throw new CotejoCompraInvalidoException(
        `La factura "${input.purchaseInvoiceId}" está asociada a otra orden de compra distinta de "${input.purchaseOrderId}".`,
      );
    }

    const cantidadRecibidaPorProducto = new Map<string, number>();
    for (const linea of recepcion.goods_receipt_note_lines) {
      const previo = cantidadRecibidaPorProducto.get(linea.product_id) ?? 0;
      cantidadRecibidaPorProducto.set(linea.product_id, previo + Number(linea.quantity));
    }

    let discrepancyAmount = 0;
    for (const lineaFactura of factura.purchase_invoice_lines) {
      const lineaOrden = orden.purchase_order_lines.find(
        (l) => l.product_id === lineaFactura.product_id,
      );
      const cantidadRecibida = cantidadRecibidaPorProducto.get(lineaFactura.product_id) ?? 0;
      const precioOrdenado = lineaOrden ? Number(lineaOrden.unit_price) : 0;
      const montoEsperado = cantidadRecibida * precioOrdenado;
      const montoFacturado = Number(lineaFactura.quantity) * Number(lineaFactura.unit_cost);
      discrepancyAmount += Math.abs(montoFacturado - montoEsperado);
    }
    discrepancyAmount = Number(discrepancyAmount.toFixed(4));

    const toleranceAmount = Number(factura.total_amount) * TOLERANCE_PERCENTAGE;
    const isWithinTolerance = discrepancyAmount <= toleranceAmount;

    new CotejoCompra(
      'pendiente',
      input.purchaseOrderId,
      input.receiptNoteId,
      input.purchaseInvoiceId,
      discrepancyAmount,
      isWithinTolerance,
    ); // valida invariantes antes de tocar la base

    return this.cotejoCompraRepository.crear(context, {
      companyId: orden.company_id,
      branchId: orden.branch_id,
      purchaseOrderId: input.purchaseOrderId,
      receiptNoteId: input.receiptNoteId,
      purchaseInvoiceId: input.purchaseInvoiceId,
      discrepancyAmount,
      isWithinTolerance,
    });
  }

  async obtener(context: UserContext, id: string): Promise<purchase_invoice_matching> {
    const cotejo = await this.cotejoCompraRepository.obtener(context, id);
    if (!cotejo) throw new CotejoCompraNoEncontradoException(id);
    return cotejo;
  }

  async listar(
    context: UserContext,
    filtros: {
      companyId: string;
      purchaseOrderId?: string;
      receiptNoteId?: string;
      purchaseInvoiceId?: string;
    },
    pagination: PaginationParams,
  ): Promise<PaginatedResult<purchase_invoice_matching>> {
    return this.cotejoCompraRepository.listar(
      context,
      {
        company_id: filtros.companyId,
        ...(filtros.purchaseOrderId ? { purchase_order_id: filtros.purchaseOrderId } : {}),
        ...(filtros.receiptNoteId ? { receipt_note_id: filtros.receiptNoteId } : {}),
        ...(filtros.purchaseInvoiceId ? { purchase_invoice_id: filtros.purchaseInvoiceId } : {}),
      },
      pagination,
    );
  }

  async anular(context: UserContext, id: string): Promise<purchase_invoice_matching> {
    await this.obtener(context, id);
    return this.cotejoCompraRepository.anular(context, id);
  }
}
