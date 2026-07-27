import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { quotes } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import {
  CotizacionRepository,
  type LineaCotizacionParams,
  type CotizacionConLineas,
  type OrdenCotizacion,
} from '../repositories/cotizacion.repository';
import { EstadoCotizacionRepository } from '../repositories/estado-cotizacion.repository';
import { ClienteLookupRepository } from '../repositories/cliente-lookup.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import { EmpresaSucursalLookupRepository } from '../repositories/empresa-sucursal-lookup.repository';
import { Cotizacion } from '../entities/cotizacion.entity';
import type {
  CrearCotizacionInput,
  ActualizarCotizacionInput,
} from '../validators/cotizaciones.schema';

export class CotizacionNoEncontradaException extends DomainException {
  constructor(id: string) {
    super('COTIZACION_NO_ENCONTRADA', `No existe la cotización "${id}".`, 404);
  }
}

export class CotizacionInvalidaException extends DomainException {
  constructor(mensaje: string) {
    super('COTIZACION_INVALIDA', mensaje, 400);
  }
}

export class CotizacionNoEsBorradorException extends DomainException {
  constructor(id: string, estadoActual: string) {
    super(
      'COTIZACION_NO_ES_BORRADOR',
      `La cotización "${id}" ya no es un borrador (estado actual: "${estadoActual}") — no puede editarse, aprobarse ni rechazarse.`,
      409,
    );
  }
}

export class CotizacionVencidaException extends DomainException {
  constructor(id: string, validUntil: Date) {
    super(
      'COTIZACION_VENCIDA',
      `La cotización "${id}" venció el ${validUntil.toISOString().slice(0, 10)} — no puede convertirse en pedido.`,
      409,
    );
  }
}

export class CotizacionYaConvertidaException extends DomainException {
  constructor(id: string) {
    super('COTIZACION_YA_CONVERTIDA', `La cotización "${id}" ya fue convertida en pedido.`, 409);
  }
}

function construirCotizacion(
  id: string,
  companyId: string,
  branchId: string,
  customerId: string,
  lines: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    discountPercentage?: number;
  }>,
  validUntil: Date | null,
): void {
  try {
    new Cotizacion(id, companyId, branchId, customerId, lines, validUntil);
  } catch (error) {
    throw new CotizacionInvalidaException(error instanceof Error ? error.message : String(error));
  }
}

function calcularTotal(
  lines: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    discountPercentage?: number;
  }>,
): { lineasCalculadas: LineaCotizacionParams[]; totalAmount: number } {
  const lineasCalculadas = lines.map((l) => ({
    productId: l.productId,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    discountPercentage: l.discountPercentage ?? 0,
  }));
  const totalAmount = lineasCalculadas.reduce(
    (acc, l) => acc + l.quantity * l.unitPrice * (1 - l.discountPercentage / 100),
    0,
  );
  return { lineasCalculadas, totalAmount: Number(totalAmount.toFixed(4)) };
}

function generarNumeroDocumento(prefijo: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const azar = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefijo}-${timestamp}-${azar}`;
}

/**
 * Cotizaciones (`sales.quotes`/`quote_lines`) — Módulo de Ventas
 * Enterprise, Parte 1. Ciclo: `draft` → `approved`|`rejected`,
 * `approved` → `converted` (al generar un pedido). No calcula impuesto
 * (a diferencia de `Factura`) — es una estimación comercial, el
 * impuesto real se calcula recién en la factura final.
 */
@Injectable()
export class CotizacionesService {
  constructor(
    private readonly cotizacionRepository: CotizacionRepository,
    private readonly estadoCotizacionRepository: EstadoCotizacionRepository,
    private readonly clienteLookupRepository: ClienteLookupRepository,
    private readonly productoLookupRepository: ProductoLookupRepository,
    private readonly empresaSucursalLookupRepository: EmpresaSucursalLookupRepository,
  ) {}

  private async resolverEstadoPorCodigo(context: UserContext, code: string): Promise<string> {
    const existente = await this.estadoCotizacionRepository.findMany(
      context,
      { code },
      { page: 1, pageSize: 1 },
    );
    if (existente.data[0]) return existente.data[0].id;
    try {
      const creado = await this.estadoCotizacionRepository.create(context, {
        tenant_id: context.tenantId,
        code,
      });
      return creado.id;
    } catch (error) {
      const esViolacionDeUnicidad =
        typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
      if (!esViolacionDeUnicidad) throw error;
      const reintento = await this.estadoCotizacionRepository.findMany(
        context,
        { code },
        { page: 1, pageSize: 1 },
      );
      if (!reintento.data[0]) throw error;
      return reintento.data[0].id;
    }
  }

  private async obtenerCodigoEstado(context: UserContext, statusId: string): Promise<string> {
    const estado = await this.estadoCotizacionRepository.findById(context, { id: statusId });
    return estado?.code ?? '';
  }

  private async validarReferencias(
    context: UserContext,
    companyId: string,
    branchId: string,
    customerId: string,
    lines: Array<{ productId: string }>,
  ): Promise<void> {
    const empresaValida = await this.empresaSucursalLookupRepository.existeEmpresa(
      context,
      companyId,
    );
    if (!empresaValida)
      throw new CotizacionInvalidaException(`No existe la empresa "${companyId}".`);

    const sucursalValida = await this.empresaSucursalLookupRepository.existeSucursalDeEmpresa(
      context,
      branchId,
      companyId,
    );
    if (!sucursalValida) {
      throw new CotizacionInvalidaException(`No existe la sucursal "${branchId}" en esa empresa.`);
    }

    const clienteValido = await this.clienteLookupRepository.existeCliente(context, customerId);
    if (!clienteValido)
      throw new CotizacionInvalidaException(`No existe el cliente "${customerId}".`);

    for (const linea of lines) {
      const productoValido = await this.productoLookupRepository.existeProducto(
        context,
        linea.productId,
      );
      if (!productoValido) {
        throw new CotizacionInvalidaException(`No existe el producto "${linea.productId}".`);
      }
    }
  }

  async crear(context: UserContext, input: CrearCotizacionInput): Promise<CotizacionConLineas> {
    const validUntil = input.validUntil ?? null;
    construirCotizacion(
      'pendiente',
      input.companyId,
      input.branchId,
      input.customerId,
      input.lines,
      validUntil,
    );
    await this.validarReferencias(
      context,
      input.companyId,
      input.branchId,
      input.customerId,
      input.lines,
    );

    const statusId = await this.resolverEstadoPorCodigo(context, 'draft');
    const { lineasCalculadas, totalAmount } = calcularTotal(input.lines);

    return this.cotizacionRepository.crear(context, {
      companyId: input.companyId,
      branchId: input.branchId,
      customerId: input.customerId,
      salespersonId: input.salespersonId ?? null,
      statusId,
      currencyCode: input.currencyCode,
      documentNumber: generarNumeroDocumento('COT'),
      totalAmount,
      validUntil,
      lines: lineasCalculadas,
    });
  }

  async obtener(context: UserContext, id: string): Promise<CotizacionConLineas> {
    const cotizacion = await this.cotizacionRepository.obtener(context, id);
    if (!cotizacion) throw new CotizacionNoEncontradaException(id);
    return cotizacion;
  }

  async listar(
    context: UserContext,
    filtros: { companyId: string; branchId?: string; customerId?: string; statusId?: string },
    pagination: PaginationParams,
    orden?: { campo: OrdenCotizacion; direccion: 'asc' | 'desc' },
  ): Promise<PaginatedResult<quotes>> {
    return this.cotizacionRepository.listar(
      context,
      {
        company_id: filtros.companyId,
        ...(filtros.branchId ? { branch_id: filtros.branchId } : {}),
        ...(filtros.customerId ? { customer_id: filtros.customerId } : {}),
        ...(filtros.statusId ? { status_id: filtros.statusId } : {}),
      },
      pagination,
      orden,
    );
  }

  async actualizar(
    context: UserContext,
    id: string,
    input: ActualizarCotizacionInput,
  ): Promise<CotizacionConLineas> {
    const actual = await this.obtener(context, id);
    const estadoActual = await this.obtenerCodigoEstado(context, actual.status_id);
    if (estadoActual !== 'draft') throw new CotizacionNoEsBorradorException(id, estadoActual);

    const validUntil = input.validUntil ?? actual.valid_until ?? null;
    construirCotizacion(
      actual.id,
      actual.company_id,
      actual.branch_id,
      actual.customer_id,
      input.lines,
      validUntil,
    );
    await this.validarReferencias(
      context,
      actual.company_id,
      actual.branch_id,
      actual.customer_id,
      input.lines,
    );

    const { lineasCalculadas, totalAmount } = calcularTotal(input.lines);
    return this.cotizacionRepository.actualizar(context, id, {
      companyId: actual.company_id,
      branchId: actual.branch_id,
      customerId: actual.customer_id,
      salespersonId: input.salespersonId ?? actual.salesperson_id,
      currencyCode: actual.currency_code,
      totalAmount,
      validUntil,
      lines: lineasCalculadas,
    });
  }

  async eliminar(context: UserContext, id: string): Promise<quotes> {
    const actual = await this.obtener(context, id);
    const estadoActual = await this.obtenerCodigoEstado(context, actual.status_id);
    if (estadoActual !== 'draft') throw new CotizacionNoEsBorradorException(id, estadoActual);
    return this.cotizacionRepository.eliminar(context, id);
  }

  async aprobar(context: UserContext, id: string): Promise<quotes> {
    const actual = await this.obtener(context, id);
    const estadoActual = await this.obtenerCodigoEstado(context, actual.status_id);
    if (estadoActual !== 'draft') throw new CotizacionNoEsBorradorException(id, estadoActual);
    const statusId = await this.resolverEstadoPorCodigo(context, 'approved');
    return this.cotizacionRepository.actualizarEstado(context, id, statusId);
  }

  async rechazar(context: UserContext, id: string): Promise<quotes> {
    const actual = await this.obtener(context, id);
    const estadoActual = await this.obtenerCodigoEstado(context, actual.status_id);
    if (estadoActual !== 'draft') throw new CotizacionNoEsBorradorException(id, estadoActual);
    const statusId = await this.resolverEstadoPorCodigo(context, 'rejected');
    return this.cotizacionRepository.actualizarEstado(context, id, statusId);
  }

  /** Nueva cotización en `draft` con las mismas líneas — recalcula el total con los precios enviados (no reconsulta lista de precios, sin ese motor todavía). */
  async duplicar(context: UserContext, id: string): Promise<CotizacionConLineas> {
    const original = await this.obtener(context, id);
    return this.crear(context, {
      companyId: original.company_id,
      branchId: original.branch_id,
      customerId: original.customer_id,
      salespersonId: original.salesperson_id ?? undefined,
      currencyCode: original.currency_code,
      validUntil: original.valid_until ?? undefined,
      lines: original.quote_lines.map((l) => ({
        productId: l.product_id,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unit_price),
        discountPercentage: Number(l.discount_percentage),
      })),
    });
  }

  /** Marca la cotización `converted` — la creación real del pedido la hace `PedidosVentaService.crearDesdeCotizacion`, que llama a este método después de crear el pedido. */
  async marcarConvertida(context: UserContext, id: string): Promise<quotes> {
    const statusId = await this.resolverEstadoPorCodigo(context, 'converted');
    return this.cotizacionRepository.actualizarEstado(context, id, statusId);
  }

  /** Validaciones de vigencia/estado antes de convertir — usado por `PedidosVentaService.crearDesdeCotizacion`. */
  async validarConvertible(context: UserContext, id: string): Promise<CotizacionConLineas> {
    const cotizacion = await this.obtener(context, id);
    const estadoActual = await this.obtenerCodigoEstado(context, cotizacion.status_id);
    if (estadoActual === 'converted') throw new CotizacionYaConvertidaException(id);
    if (estadoActual !== 'approved') {
      throw new CotizacionInvalidaException(
        `La cotización "${id}" debe estar aprobada para convertirse en pedido (estado actual: "${estadoActual}").`,
      );
    }
    if (cotizacion.valid_until && cotizacion.valid_until.getTime() < Date.now()) {
      throw new CotizacionVencidaException(id, cotizacion.valid_until);
    }
    return cotizacion;
  }
}
