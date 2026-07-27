import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { invoices } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import {
  FacturaRepository,
  type FacturaConLineas,
  type LineaFacturaParams,
  type OrdenFactura,
} from '../repositories/factura.repository';
import { EstadoFacturaRepository } from '../repositories/estado-factura.repository';
import { ReciboRepository, type ReciboConAllocations } from '../repositories/recibo.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import { ClienteLookupRepository } from '../repositories/cliente-lookup.repository';
import { EmpresaSucursalLookupRepository } from '../repositories/empresa-sucursal-lookup.repository';
import { TasaImpuestoLookupRepository } from '../repositories/tasa-impuesto-lookup.repository';
import { Factura } from '../entities/factura.entity';
import type { CrearFacturaInput, ActualizarFacturaInput } from '../validators/facturas.schema';
import { MotorContableService } from '@gorazus/modules/contabilidad';

export class FacturaNoEncontradaException extends DomainException {
  constructor(id: string) {
    super('FACTURA_NO_ENCONTRADA', `No existe la factura "${id}".`, 404);
  }
}

export class EmpresaInvalidaException extends DomainException {
  constructor(companyId: string) {
    super('EMPRESA_INVALIDA', `No existe la empresa "${companyId}".`, 400);
  }
}

export class SucursalInvalidaException extends DomainException {
  constructor(branchId: string, companyId: string) {
    super(
      'SUCURSAL_INVALIDA',
      `No existe la sucursal "${branchId}", o no pertenece a la empresa "${companyId}".`,
      400,
    );
  }
}

export class ClienteInvalidoException extends DomainException {
  constructor(customerId: string) {
    super('CLIENTE_INVALIDO', `No existe el cliente "${customerId}".`, 400);
  }
}

export class ProductoInvalidoException extends DomainException {
  constructor(productId: string) {
    super('PRODUCTO_INVALIDO', `No existe el producto "${productId}".`, 400);
  }
}

export class TransicionFacturaInvalidaException extends DomainException {
  constructor(estadoActual: string, destino: string) {
    super(
      'TRANSICION_FACTURA_INVALIDA',
      `No se puede pasar la factura de "${estadoActual}" a "${destino}".`,
      409,
    );
  }
}

/** Editar/eliminar una factura solo está permitido mientras sigue en borrador. */
export class FacturaNoEsBorradorException extends DomainException {
  constructor(id: string, estadoActual: string) {
    super(
      'FACTURA_NO_ES_BORRADOR',
      `La factura "${id}" ya no es un borrador (estado actual: "${estadoActual}") — no puede editarse ni eliminarse.`,
      409,
    );
  }
}

export class FacturaYaAnuladaException extends DomainException {
  constructor(id: string) {
    super('FACTURA_YA_ANULADA', `La factura "${id}" ya está anulada.`, 409);
  }
}

function esViolacionDeUnicidad(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}

function generarNumeroDocumento(prefijo: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const azar = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefijo}-${timestamp}-${azar}`;
}

/**
 * Ventas — la venta POS **es** una factura directa (`sales_channel='pos'`),
 * sin cotización/pedido/remito previos (`POS_ARCHITECTURE.md §3`).
 * `document_number` es un correlativo interno simple (timestamp+azar),
 * NO un folio fiscal timbrado real.
 */
@Injectable()
export class VentasService {
  constructor(
    private readonly facturaRepository: FacturaRepository,
    private readonly estadoFacturaRepository: EstadoFacturaRepository,
    private readonly reciboRepository: ReciboRepository,
    private readonly productoLookupRepository: ProductoLookupRepository,
    private readonly clienteLookupRepository: ClienteLookupRepository,
    private readonly empresaSucursalLookupRepository: EmpresaSucursalLookupRepository,
    private readonly tasaImpuestoLookupRepository: TasaImpuestoLookupRepository,
    private readonly motorContableService: MotorContableService,
  ) {}

  /** Get-or-create idempotente del estado por código — mismo patrón que `CajaService.resolverTipoPorCodigo`. */
  async resolverEstadoPorCodigo(context: UserContext, code: string): Promise<string> {
    const existente = await this.estadoFacturaRepository.findMany(
      context,
      { code },
      { page: 1, pageSize: 1 },
    );
    if (existente.data[0]) return existente.data[0].id;

    try {
      const creado = await this.estadoFacturaRepository.create(context, {
        tenant_id: context.tenantId,
        code,
        is_final: code === 'issued' || code === 'cancelled',
      });
      return creado.id;
    } catch (error) {
      if (!esViolacionDeUnicidad(error)) throw error;
      const reintento = await this.estadoFacturaRepository.findMany(
        context,
        { code },
        { page: 1, pageSize: 1 },
      );
      if (!reintento.data[0]) throw error;
      return reintento.data[0].id;
    }
  }

  /**
   * Impuesto real por línea (`taxes.tax_rates`, tasa vigente hoy) — una
   * línea sin `taxId` o cuyo impuesto no tiene tasa vigente no bloquea
   * la venta, simplemente no suma impuesto (`POS_FLOW.md`,
   * "Calcular impuestos"). Descuento general: se aplica sobre el
   * subtotal ya neto de descuentos de línea, **sin** recalcular el
   * impuesto (decisión documentada en `sql/40_facturacion_descuento_general.sql`
   * — el impuesto ya se calculó sobre el precio con descuento de línea
   * únicamente, no se prorratea de nuevo).
   */
  private async calcularLineas(
    context: UserContext,
    lines: Array<{
      productId: string;
      taxId?: string;
      quantity: number;
      unitPrice: number;
      discountPercentage?: number;
    }>,
    generalDiscountPercentage: number,
  ): Promise<{
    lineasCalculadas: LineaFacturaParams[];
    subtotalAmount: number;
    taxAmount: number;
    totalAmount: number;
  }> {
    let taxAmount = 0;
    const lineasCalculadas: LineaFacturaParams[] = [];
    for (const linea of lines) {
      const descuento = linea.discountPercentage ?? 0;
      const subtotalLinea = linea.quantity * linea.unitPrice * (1 - descuento / 100);
      const tasa = linea.taxId
        ? await this.tasaImpuestoLookupRepository.tasaVigente(context, linea.taxId)
        : null;
      const impuestoLinea = tasa ? subtotalLinea * (tasa / 100) : 0;
      taxAmount += impuestoLinea;
      lineasCalculadas.push({
        productId: linea.productId,
        taxId: linea.taxId ?? null,
        quantity: linea.quantity,
        unitPrice: linea.unitPrice,
        discountPercentage: descuento,
        lineTotal: Number(subtotalLinea.toFixed(4)),
      });
    }
    const subtotalBruto = lineasCalculadas.reduce((acc, l) => acc + l.lineTotal, 0);
    const subtotalAmount = subtotalBruto * (1 - generalDiscountPercentage / 100);

    return {
      lineasCalculadas,
      subtotalAmount: Number(subtotalAmount.toFixed(4)),
      taxAmount: Number(taxAmount.toFixed(4)),
      totalAmount: Number((subtotalAmount + taxAmount).toFixed(4)),
    };
  }

  /** Código del estado actual de una factura (`draft`/`issued`/`cancelled`) — `invoice_status` es un catálogo de solo lectura desde la app, ver `EstadoFacturaRepository`. */
  private async obtenerCodigoEstado(context: UserContext, statusId: string): Promise<string> {
    const estado = await this.estadoFacturaRepository.findById(context, { id: statusId });
    return estado?.code ?? '';
  }

  async crearFactura(context: UserContext, input: CrearFacturaInput): Promise<FacturaConLineas> {
    new Factura(
      'pendiente',
      input.companyId,
      input.branchId,
      input.customerId,
      input.lines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        discountPercentage: l.discountPercentage,
      })),
    ); // valida invariantes antes de tocar la base

    const empresaValida = await this.empresaSucursalLookupRepository.existeEmpresa(
      context,
      input.companyId,
    );
    if (!empresaValida) throw new EmpresaInvalidaException(input.companyId);

    const sucursalValida = await this.empresaSucursalLookupRepository.existeSucursalDeEmpresa(
      context,
      input.branchId,
      input.companyId,
    );
    if (!sucursalValida) throw new SucursalInvalidaException(input.branchId, input.companyId);

    const clienteValido = await this.clienteLookupRepository.existeCliente(
      context,
      input.customerId,
    );
    if (!clienteValido) throw new ClienteInvalidoException(input.customerId);

    for (const linea of input.lines) {
      const productoValido = await this.productoLookupRepository.existeProducto(
        context,
        linea.productId,
      );
      if (!productoValido) throw new ProductoInvalidoException(linea.productId);
    }

    const statusId = await this.resolverEstadoPorCodigo(context, 'draft');
    const generalDiscountPercentage = input.generalDiscountPercentage ?? 0;
    const salesChannel = input.salesChannel ?? 'store';
    const { lineasCalculadas, subtotalAmount, taxAmount, totalAmount } = await this.calcularLineas(
      context,
      input.lines,
      generalDiscountPercentage,
    );

    return this.facturaRepository.crear(context, {
      companyId: input.companyId,
      branchId: input.branchId,
      customerId: input.customerId,
      statusId,
      salesChannel,
      currencyCode: input.currencyCode,
      documentNumber: generarNumeroDocumento(salesChannel === 'pos' ? 'POS' : 'FAC'),
      subtotalAmount,
      taxAmount,
      totalAmount,
      generalDiscountPercentage,
      lines: lineasCalculadas,
    });
  }

  /** Solo se puede editar mientras la factura sigue en `draft` — recalcula totales igual que `crearFactura`. */
  async actualizarBorrador(
    context: UserContext,
    id: string,
    input: ActualizarFacturaInput,
  ): Promise<FacturaConLineas> {
    const factura = await this.obtener(context, id);
    const estadoActual = await this.obtenerCodigoEstado(context, factura.status_id);
    if (estadoActual !== 'draft') throw new FacturaNoEsBorradorException(id, estadoActual);

    new Factura(
      factura.id,
      factura.company_id,
      factura.branch_id,
      factura.customer_id,
      input.lines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        discountPercentage: l.discountPercentage,
      })),
    ); // valida invariantes de las líneas nuevas

    for (const linea of input.lines) {
      const productoValido = await this.productoLookupRepository.existeProducto(
        context,
        linea.productId,
      );
      if (!productoValido) throw new ProductoInvalidoException(linea.productId);
    }

    const generalDiscountPercentage = input.generalDiscountPercentage ?? 0;
    const { lineasCalculadas, subtotalAmount, taxAmount, totalAmount } = await this.calcularLineas(
      context,
      input.lines,
      generalDiscountPercentage,
    );

    return this.facturaRepository.actualizar(context, id, {
      subtotalAmount,
      taxAmount,
      totalAmount,
      generalDiscountPercentage,
      lines: lineasCalculadas,
    });
  }

  /** Solo se puede eliminar (baja lógica) mientras la factura sigue en `draft`. */
  async eliminarBorrador(context: UserContext, id: string): Promise<invoices> {
    const factura = await this.obtener(context, id);
    const estadoActual = await this.obtenerCodigoEstado(context, factura.status_id);
    if (estadoActual !== 'draft') throw new FacturaNoEsBorradorException(id, estadoActual);
    return this.facturaRepository.eliminar(context, id);
  }

  /**
   * `draft → issued` + dispara el motor de reglas contables
   * (`ventas.factura.confirmada`). No bloqueante si la empresa no tiene
   * ninguna regla configurada para ese evento — `MotorContableService`
   * devuelve `null` (caso real de la enorme mayoría de empresas hoy,
   * Contabilidad Enterprise Parte 1 recién se está construyendo). Si SÍ
   * hay una regla configurada pero está mal armada (referencia un campo
   * que no existe), la excepción se deja propagar a propósito: silenciar
   * un asiento contable mal generado es peor que bloquear la
   * confirmación hasta que un administrador corrija la regla.
   */
  async confirmarFactura(context: UserContext, id: string): Promise<invoices> {
    const factura = await this.obtener(context, id);
    const statusId = await this.resolverEstadoPorCodigo(context, 'issued');
    const facturaConfirmada = await this.facturaRepository.actualizarEstado(
      context,
      factura.id,
      statusId,
    );
    await this.motorContableService.registrarEvento(context, {
      eventCode: 'ventas.factura.confirmada',
      companyId: factura.company_id,
      branchId: factura.branch_id,
      sourceModule: 'ventas',
      sourceEntityId: factura.id,
      description: `Factura ${factura.document_number} confirmada`,
      hechos: {
        subtotal_amount: Number(factura.subtotal_amount),
        tax_amount: Number(factura.tax_amount),
        total_amount: Number(factura.total_amount),
      },
    });
    return facturaConfirmada;
  }

  /** Anula un borrador o una factura ya confirmada — `cancelled` es un estado final, no se puede anular dos veces. */
  async anularFactura(context: UserContext, id: string): Promise<invoices> {
    const factura = await this.obtener(context, id);
    const estadoActual = await this.obtenerCodigoEstado(context, factura.status_id);
    if (estadoActual === 'cancelled') throw new FacturaYaAnuladaException(id);
    const statusId = await this.resolverEstadoPorCodigo(context, 'cancelled');
    return this.facturaRepository.actualizarEstado(context, id, statusId);
  }

  /** Crea una factura borrador nueva con las mismas líneas — recalcula impuestos con la tasa vigente de hoy, no copia los montos ya calculados de la original. */
  async duplicarFactura(context: UserContext, id: string): Promise<FacturaConLineas> {
    const original = await this.obtener(context, id);
    return this.crearFactura(context, {
      companyId: original.company_id,
      branchId: original.branch_id,
      customerId: original.customer_id,
      // El canal ya fue validado por Zod cuando se creó la factura original —
      // `sales_channel` en la base es `text` libre (sin enum de Postgres), de
      // ahí el cast: en runtime siempre es uno de los 5 valores válidos.
      salesChannel: original.sales_channel as CrearFacturaInput['salesChannel'],
      currencyCode: original.currency_code,
      generalDiscountPercentage: Number(original.general_discount_percentage),
      lines: original.invoice_lines.map((l) => ({
        productId: l.product_id,
        taxId: l.tax_id ?? undefined,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unit_price),
        discountPercentage: Number(l.discount_percentage),
      })),
    });
  }

  async obtener(context: UserContext, id: string): Promise<FacturaConLineas> {
    const factura = await this.facturaRepository.obtener(context, id);
    if (!factura) throw new FacturaNoEncontradaException(id);
    return factura;
  }

  async listar(
    context: UserContext,
    filtros: {
      branchId?: string;
      customerId?: string;
      statusId?: string;
      issuedFrom?: Date;
      issuedTo?: Date;
    },
    pagination: PaginationParams,
    orden?: { campo: OrdenFactura; direccion: 'asc' | 'desc' },
  ): Promise<PaginatedResult<invoices>> {
    return this.facturaRepository.listar(
      context,
      {
        ...(filtros.branchId && { branch_id: filtros.branchId }),
        ...(filtros.customerId && { customer_id: filtros.customerId }),
        ...(filtros.statusId && { status_id: filtros.statusId }),
        ...((filtros.issuedFrom || filtros.issuedTo) && {
          issued_at: {
            ...(filtros.issuedFrom && { gte: filtros.issuedFrom }),
            ...(filtros.issuedTo && { lte: filtros.issuedTo }),
          },
        }),
      },
      pagination,
      orden,
    );
  }

  async registrarRecibo(
    context: UserContext,
    params: {
      companyId: string;
      branchId: string;
      customerId: string;
      invoiceId: string;
      paymentFormId: string | null;
      amount: number;
    },
  ): Promise<ReciboConAllocations> {
    return this.reciboRepository.crear(context, {
      companyId: params.companyId,
      branchId: params.branchId,
      customerId: params.customerId,
      documentNumber: generarNumeroDocumento('REC'),
      totalAmount: params.amount,
      paymentFormId: params.paymentFormId,
      invoiceId: params.invoiceId,
    });
  }

  async listarRecibosDeFactura(
    context: UserContext,
    invoiceId: string,
  ): Promise<ReciboConAllocations[]> {
    return this.reciboRepository.listarPorFactura(context, invoiceId);
  }
}
