import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { purchase_invoices, purchase_invoice_status_history } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import {
  FacturaCompraRepository,
  type LineaFacturaCompraParams,
  type FacturaCompraConLineas,
} from '../repositories/factura-compra.repository';
import { EstadoFacturaCompraRepository } from '../repositories/estado-factura-compra.repository';
import { HistorialEstadoFacturaRepository } from '../repositories/historial-estado-factura.repository';
import { ProveedorLookupRepository } from '../repositories/proveedor-lookup.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import { OrdenCompraRepository } from '../repositories/orden-compra.repository';
import { FacturaCompra } from '../entities/factura-compra.entity';
import type {
  CrearFacturaCompraInput,
  ActualizarFacturaCompraInput,
} from '../validators/facturas-compra.schema';

export class FacturaCompraNoEncontradaException extends DomainException {
  constructor(id: string) {
    super('FACTURA_COMPRA_NO_ENCONTRADA', `No existe la factura de compra "${id}".`, 404);
  }
}

export class FacturaCompraInvalidaException extends DomainException {
  constructor(mensaje: string) {
    super('FACTURA_COMPRA_INVALIDA', mensaje, 400);
  }
}

export class FacturaCompraDuplicadaException extends DomainException {
  constructor(supplierId: string, supplierDocumentNumber: string) {
    super(
      'FACTURA_COMPRA_DUPLICADA',
      `Ya existe una factura activa del proveedor "${supplierId}" con el número de documento "${supplierDocumentNumber}".`,
      409,
    );
  }
}

export class FacturaCompraNoEsBorradorException extends DomainException {
  constructor(id: string, estadoActual: string) {
    super(
      'FACTURA_COMPRA_NO_ES_BORRADOR',
      `La factura de compra "${id}" ya no es un borrador (estado actual: "${estadoActual}") — no puede editarse ni eliminarse.`,
      409,
    );
  }
}

export class FacturaCompraTransicionInvalidaException extends DomainException {
  constructor(id: string, estadoActual: string, accion: string) {
    super(
      'FACTURA_COMPRA_TRANSICION_INVALIDA',
      `La factura de compra "${id}" no puede "${accion}" desde su estado actual ("${estadoActual}").`,
      409,
    );
  }
}

function construirFactura(
  id: string,
  companyId: string,
  supplierId: string,
  supplierDocumentNumber: string,
  lines: Array<{ productId: string; quantity: number; unitCost: number }>,
): void {
  try {
    new FacturaCompra(id, companyId, supplierId, supplierDocumentNumber, lines);
  } catch (error) {
    throw new FacturaCompraInvalidaException(
      error instanceof Error ? error.message : String(error),
    );
  }
}

function calcularTotales(lines: Array<{ quantity: number; unitCost: number }>): {
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
} {
  const subtotalAmount = Number(
    lines.reduce((acc, l) => acc + l.quantity * l.unitCost, 0).toFixed(4),
  );
  // Sin motor de impuestos en esta fase (integración fiscal explícitamente fuera de
  // alcance) — el impuesto queda en 0 hasta que exista un cálculo real que reemplace esto.
  const taxAmount = 0;
  return { subtotalAmount, taxAmount, totalAmount: subtotalAmount + taxAmount };
}

/**
 * Facturas de Compra (`purchases.purchase_invoices`/
 * `purchase_invoice_lines`) — Compras FASE 6. Ingresa como cuenta por
 * pagar (CxP). Flujo de estados propuesto e implementado, sin
 * precedente en AKB: `draft` → `approved` → `posted` (contabilizada);
 * `cancelled` alcanzable desde `draft`/`approved`, nunca desde `posted`
 * ("no modificar facturas contabilizadas"). `posted` no dispara ningún
 * asiento contable real — integración contable fuera de alcance de esta
 * fase, es solo la marca de "ya no editable".
 *
 * Integraciones: Suppliers (existencia, sin bloquear por proveedor
 * bloqueado — a diferencia de Purchase Order, aquí se registra una
 * deuda ya generada, no se decide comprar más) y Purchase Order
 * (relación opcional, existencia). Sin integración con Goods Receipt
 * directa (eso es Purchase Matching, Fase 7) ni con Contabilidad/
 * Impuestos (fuera de alcance).
 */
@Injectable()
export class FacturasCompraService {
  constructor(
    private readonly facturaCompraRepository: FacturaCompraRepository,
    private readonly estadoFacturaCompraRepository: EstadoFacturaCompraRepository,
    private readonly historialEstadoFacturaRepository: HistorialEstadoFacturaRepository,
    private readonly proveedorLookupRepository: ProveedorLookupRepository,
    private readonly productoLookupRepository: ProductoLookupRepository,
    private readonly ordenCompraRepository: OrdenCompraRepository,
  ) {}

  private async resolverEstadoPorCodigo(context: UserContext, code: string): Promise<string> {
    const existente = await this.estadoFacturaCompraRepository.findMany(
      context,
      { code },
      { page: 1, pageSize: 1 },
    );
    if (existente.data[0]) return existente.data[0].id;
    try {
      const creado = await this.estadoFacturaCompraRepository.create(context, {
        tenant_id: context.tenantId,
        code,
        is_final: code === 'posted' || code === 'cancelled',
      });
      return creado.id;
    } catch (error) {
      const esViolacionDeUnicidad =
        typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
      if (!esViolacionDeUnicidad) throw error;
      const reintento = await this.estadoFacturaCompraRepository.findMany(
        context,
        { code },
        { page: 1, pageSize: 1 },
      );
      if (!reintento.data[0]) throw error;
      return reintento.data[0].id;
    }
  }

  private async obtenerCodigoEstado(context: UserContext, statusId: string): Promise<string> {
    const estado = await this.estadoFacturaCompraRepository.findById(context, { id: statusId });
    return estado?.code ?? '';
  }

  private async transicionar(
    context: UserContext,
    actual: purchase_invoices,
    nuevoCodigo: string,
  ): Promise<purchase_invoices> {
    const statusId = await this.resolverEstadoPorCodigo(context, nuevoCodigo);
    const actualizada = await this.facturaCompraRepository.actualizarEstado(
      context,
      actual.id,
      statusId,
    );
    await this.historialEstadoFacturaRepository.registrar(context, {
      purchaseInvoiceId: actual.id,
      companyId: actual.company_id,
      branchId: actual.branch_id,
      statusId,
    });
    return actualizada;
  }

  private async validarReferencias(
    context: UserContext,
    supplierId: string,
    purchaseOrderId: string | null | undefined,
    lines: Array<{ productId: string }>,
  ): Promise<void> {
    const proveedor = await this.proveedorLookupRepository.obtenerProveedor(context, supplierId);
    if (!proveedor)
      throw new FacturaCompraInvalidaException(`No existe el proveedor "${supplierId}".`);

    if (purchaseOrderId) {
      const orden = await this.ordenCompraRepository.obtener(context, purchaseOrderId);
      if (!orden) {
        throw new FacturaCompraInvalidaException(
          `No existe la orden de compra "${purchaseOrderId}".`,
        );
      }
    }

    for (const linea of lines) {
      const productoValido = await this.productoLookupRepository.existeProducto(
        context,
        linea.productId,
      );
      if (!productoValido) {
        throw new FacturaCompraInvalidaException(`No existe el producto "${linea.productId}".`);
      }
    }
  }

  async crear(
    context: UserContext,
    input: CrearFacturaCompraInput,
  ): Promise<FacturaCompraConLineas> {
    construirFactura(
      'pendiente',
      input.companyId,
      input.supplierId,
      input.supplierDocumentNumber,
      input.lines,
    );
    await this.validarReferencias(context, input.supplierId, input.purchaseOrderId, input.lines);

    const duplicada = await this.facturaCompraRepository.existeConReferencia(
      context,
      input.supplierId,
      input.supplierDocumentNumber,
    );
    if (duplicada) {
      throw new FacturaCompraDuplicadaException(input.supplierId, input.supplierDocumentNumber);
    }

    const statusId = await this.resolverEstadoPorCodigo(context, 'draft');
    const lines: LineaFacturaCompraParams[] = input.lines.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
      unitCost: l.unitCost,
      taxId: l.taxId ?? null,
    }));
    const { subtotalAmount, taxAmount, totalAmount } = calcularTotales(lines);

    const creada = await this.facturaCompraRepository.crear(context, {
      companyId: input.companyId,
      branchId: input.branchId ?? null,
      supplierId: input.supplierId,
      supplierDocumentNumber: input.supplierDocumentNumber,
      purchaseOrderId: input.purchaseOrderId ?? null,
      statusId,
      currencyCode: input.currencyCode,
      subtotalAmount,
      taxAmount,
      totalAmount,
      lines,
    });
    await this.historialEstadoFacturaRepository.registrar(context, {
      purchaseInvoiceId: creada.id,
      companyId: creada.company_id,
      branchId: creada.branch_id,
      statusId,
    });
    return creada;
  }

  async obtener(context: UserContext, id: string): Promise<FacturaCompraConLineas> {
    const factura = await this.facturaCompraRepository.obtener(context, id);
    if (!factura) throw new FacturaCompraNoEncontradaException(id);
    return factura;
  }

  async listar(
    context: UserContext,
    filtros: {
      companyId: string;
      supplierId?: string;
      statusId?: string;
      purchaseOrderId?: string;
    },
    pagination: PaginationParams,
  ): Promise<PaginatedResult<purchase_invoices>> {
    return this.facturaCompraRepository.listar(
      context,
      {
        company_id: filtros.companyId,
        ...(filtros.supplierId ? { supplier_id: filtros.supplierId } : {}),
        ...(filtros.statusId ? { status_id: filtros.statusId } : {}),
        ...(filtros.purchaseOrderId ? { purchase_order_id: filtros.purchaseOrderId } : {}),
      },
      pagination,
    );
  }

  async historial(context: UserContext, id: string): Promise<purchase_invoice_status_history[]> {
    await this.obtener(context, id);
    return this.historialEstadoFacturaRepository.listar(context, id);
  }

  async actualizar(
    context: UserContext,
    id: string,
    input: ActualizarFacturaCompraInput,
  ): Promise<FacturaCompraConLineas> {
    const actual = await this.obtener(context, id);
    const estadoActual = await this.obtenerCodigoEstado(context, actual.status_id);
    if (estadoActual !== 'draft') throw new FacturaCompraNoEsBorradorException(id, estadoActual);

    construirFactura(
      actual.id,
      actual.company_id,
      actual.supplier_id,
      actual.supplier_document_number,
      input.lines,
    );
    for (const linea of input.lines) {
      const productoValido = await this.productoLookupRepository.existeProducto(
        context,
        linea.productId,
      );
      if (!productoValido) {
        throw new FacturaCompraInvalidaException(`No existe el producto "${linea.productId}".`);
      }
    }

    const lines: LineaFacturaCompraParams[] = input.lines.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
      unitCost: l.unitCost,
      taxId: l.taxId ?? null,
    }));
    const { subtotalAmount, taxAmount, totalAmount } = calcularTotales(lines);
    return this.facturaCompraRepository.actualizar(context, id, {
      subtotalAmount,
      taxAmount,
      totalAmount,
      lines,
    });
  }

  async eliminar(context: UserContext, id: string): Promise<purchase_invoices> {
    const actual = await this.obtener(context, id);
    const estadoActual = await this.obtenerCodigoEstado(context, actual.status_id);
    if (estadoActual !== 'draft') throw new FacturaCompraNoEsBorradorException(id, estadoActual);
    return this.facturaCompraRepository.eliminar(context, id);
  }

  async aprobar(context: UserContext, id: string): Promise<purchase_invoices> {
    const actual = await this.obtener(context, id);
    const estadoActual = await this.obtenerCodigoEstado(context, actual.status_id);
    if (estadoActual !== 'draft') {
      throw new FacturaCompraTransicionInvalidaException(id, estadoActual, 'aprobar');
    }
    return this.transicionar(context, actual, 'approved');
  }

  async contabilizar(context: UserContext, id: string): Promise<purchase_invoices> {
    const actual = await this.obtener(context, id);
    const estadoActual = await this.obtenerCodigoEstado(context, actual.status_id);
    if (estadoActual !== 'approved') {
      throw new FacturaCompraTransicionInvalidaException(id, estadoActual, 'contabilizar');
    }
    return this.transicionar(context, actual, 'posted');
  }

  async cancelar(context: UserContext, id: string): Promise<purchase_invoices> {
    const actual = await this.obtener(context, id);
    const estadoActual = await this.obtenerCodigoEstado(context, actual.status_id);
    if (estadoActual !== 'draft' && estadoActual !== 'approved') {
      throw new FacturaCompraTransicionInvalidaException(id, estadoActual, 'cancelar');
    }
    return this.transicionar(context, actual, 'cancelled');
  }
}
