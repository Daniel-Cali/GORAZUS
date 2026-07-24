import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { invoices } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { FacturaRepository, type FacturaConLineas } from '../repositories/factura.repository';
import { EstadoFacturaRepository } from '../repositories/estado-factura.repository';
import { ReciboRepository, type ReciboConAllocations } from '../repositories/recibo.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import { ClienteLookupRepository } from '../repositories/cliente-lookup.repository';
import { EmpresaSucursalLookupRepository } from '../repositories/empresa-sucursal-lookup.repository';
import { TasaImpuestoLookupRepository } from '../repositories/tasa-impuesto-lookup.repository';
import { Factura } from '../entities/factura.entity';
import type { CrearFacturaInput } from '../validators/facturas.schema';

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

    // Impuesto real por línea (`taxes.tax_rates`, tasa vigente hoy) — una
    // línea sin `taxId` o cuyo impuesto no tiene tasa vigente no bloquea
    // la venta, simplemente no suma impuesto (`POS_FLOW.md`,
    // "Calcular impuestos").
    let taxAmount = 0;
    const lineasCalculadas = [];
    for (const linea of input.lines) {
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
    const subtotalAmount = lineasCalculadas.reduce((acc, l) => acc + l.lineTotal, 0);

    return this.facturaRepository.crear(context, {
      companyId: input.companyId,
      branchId: input.branchId,
      customerId: input.customerId,
      statusId,
      salesChannel: input.salesChannel,
      currencyCode: input.currencyCode,
      documentNumber: generarNumeroDocumento(input.salesChannel === 'pos' ? 'POS' : 'FAC'),
      subtotalAmount: Number(subtotalAmount.toFixed(4)),
      taxAmount: Number(taxAmount.toFixed(4)),
      totalAmount: Number((subtotalAmount + taxAmount).toFixed(4)),
      lines: lineasCalculadas,
    });
  }

  async confirmarFactura(context: UserContext, id: string): Promise<invoices> {
    const factura = await this.obtener(context, id);
    const statusId = await this.resolverEstadoPorCodigo(context, 'issued');
    return this.facturaRepository.actualizarEstado(context, factura.id, statusId);
  }

  async obtener(context: UserContext, id: string): Promise<FacturaConLineas> {
    const factura = await this.facturaRepository.obtener(context, id);
    if (!factura) throw new FacturaNoEncontradaException(id);
    return factura;
  }

  async listar(
    context: UserContext,
    branchId: string | undefined,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<invoices>> {
    return this.facturaRepository.listar(
      context,
      branchId ? { branch_id: branchId } : {},
      pagination,
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
