import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { sales_orders } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { ReservasService } from '@gorazus/modules/inventario';
import {
  PedidoRepository,
  type LineaPedidoParams,
  type PedidoConLineas,
  type OrdenPedido,
} from '../repositories/pedido.repository';
import { EstadoPedidoRepository } from '../repositories/estado-pedido.repository';
import { ClienteLookupRepository } from '../repositories/cliente-lookup.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import { EmpresaSucursalLookupRepository } from '../repositories/empresa-sucursal-lookup.repository';
import { CotizacionesService } from './cotizaciones.service';
import { VentasService } from './ventas.service';
import { Pedido } from '../entities/pedido.entity';
import type { CrearPedidoInput, ConvertirPedidoAFacturaInput } from '../validators/pedidos.schema';
import type { FacturaConLineas } from '../repositories/factura.repository';

const CODIGO_ORIGEN_RESERVA = 'ventas_pedido';

export class PedidoNoEncontradoException extends DomainException {
  constructor(id: string) {
    super('PEDIDO_NO_ENCONTRADO', `No existe el pedido "${id}".`, 404);
  }
}

export class PedidoInvalidoException extends DomainException {
  constructor(mensaje: string) {
    super('PEDIDO_INVALIDO', mensaje, 400);
  }
}

export class PedidoNoCancelableException extends DomainException {
  constructor(id: string) {
    super(
      'PEDIDO_NO_CANCELABLE',
      `El pedido "${id}" ya tiene líneas facturadas (parcial o totalmente) — no puede cancelarse.`,
      409,
    );
  }
}

export class PedidoSinSaldoPendienteException extends DomainException {
  constructor(id: string) {
    super(
      'PEDIDO_SIN_SALDO_PENDIENTE',
      `El pedido "${id}" no tiene líneas con saldo pendiente por facturar.`,
      409,
    );
  }
}

export class LineaPedidoInvalidaException extends DomainException {
  constructor(mensaje: string) {
    super('LINEA_PEDIDO_INVALIDA', mensaje, 400);
  }
}

function construirPedido(
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
): void {
  try {
    new Pedido(id, companyId, branchId, customerId, lines);
  } catch (error) {
    throw new PedidoInvalidoException(error instanceof Error ? error.message : String(error));
  }
}

function calcularTotal(
  lines: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    discountPercentage?: number;
  }>,
): { lineasCalculadas: LineaPedidoParams[]; totalAmount: number } {
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
 * Pedidos de venta (`sales.sales_orders`/`sales_order_lines`) — Módulo
 * de Ventas Enterprise, Parte 1. Ciclo: `pending` → `partial`|
 * `completed` (según cuánto de cada línea ya se convirtió en factura,
 * `invoiced_quantity`) → `cancelled`.
 *
 * **Reserva de inventario, alcance real de esta parte**: al crear el
 * pedido se reserva la cantidad completa de cada línea
 * (`ReservasService.crear`, orquestación no atómica entre schemas —
 * mismo límite ya documentado en `PosCheckoutService`). La reserva se
 * libera recién cuando el pedido queda 100% facturado o se cancela —
 * no hay liberación parcial (`ReservasService` no tiene esa
 * operación todavía). **No se descuenta stock real** al facturar
 * (`MovimientosService.registrarLote`) — ese paso queda para cuando el
 * proceso de despacho/entrega (`Entregas`, fuera de esta parte) exista;
 * mismo criterio que "no descontar inventario todavía" de Facturación
 * Parte 1.
 */
@Injectable()
export class PedidosVentaService {
  constructor(
    private readonly pedidoRepository: PedidoRepository,
    private readonly estadoPedidoRepository: EstadoPedidoRepository,
    private readonly clienteLookupRepository: ClienteLookupRepository,
    private readonly productoLookupRepository: ProductoLookupRepository,
    private readonly empresaSucursalLookupRepository: EmpresaSucursalLookupRepository,
    private readonly reservasService: ReservasService,
    private readonly cotizacionesService: CotizacionesService,
    private readonly ventasService: VentasService,
  ) {}

  private async resolverEstadoPorCodigo(context: UserContext, code: string): Promise<string> {
    const existente = await this.estadoPedidoRepository.findMany(
      context,
      { code },
      { page: 1, pageSize: 1 },
    );
    if (existente.data[0]) return existente.data[0].id;
    try {
      const creado = await this.estadoPedidoRepository.create(context, {
        tenant_id: context.tenantId,
        code,
      });
      return creado.id;
    } catch (error) {
      const esViolacionDeUnicidad =
        typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
      if (!esViolacionDeUnicidad) throw error;
      const reintento = await this.estadoPedidoRepository.findMany(
        context,
        { code },
        { page: 1, pageSize: 1 },
      );
      if (!reintento.data[0]) throw error;
      return reintento.data[0].id;
    }
  }

  private async obtenerCodigoEstado(context: UserContext, statusId: string): Promise<string> {
    const estado = await this.estadoPedidoRepository.findById(context, { id: statusId });
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
    if (!empresaValida) throw new PedidoInvalidoException(`No existe la empresa "${companyId}".`);

    const sucursalValida = await this.empresaSucursalLookupRepository.existeSucursalDeEmpresa(
      context,
      branchId,
      companyId,
    );
    if (!sucursalValida) {
      throw new PedidoInvalidoException(`No existe la sucursal "${branchId}" en esa empresa.`);
    }

    const clienteValido = await this.clienteLookupRepository.existeCliente(context, customerId);
    if (!clienteValido) throw new PedidoInvalidoException(`No existe el cliente "${customerId}".`);

    for (const linea of lines) {
      const productoValido = await this.productoLookupRepository.existeProducto(
        context,
        linea.productId,
      );
      if (!productoValido) {
        throw new PedidoInvalidoException(`No existe el producto "${linea.productId}".`);
      }
    }
  }

  /** Reserva cada línea; si una falla a mitad de camino, libera las ya creadas (compensación best-effort, no atómica). */
  private async reservarLineas(
    context: UserContext,
    pedidoId: string,
    warehouseId: string,
    lines: Array<{ productId: string; quantity: number }>,
  ): Promise<void> {
    const reservasCreadas: string[] = [];
    try {
      for (const linea of lines) {
        const reserva = await this.reservasService.crear(context, {
          productId: linea.productId,
          warehouseId,
          quantity: linea.quantity,
          sourceModule: CODIGO_ORIGEN_RESERVA,
          sourceEntityId: pedidoId,
        });
        reservasCreadas.push(reserva.id);
      }
    } catch (error) {
      await Promise.all(
        reservasCreadas.map((id) =>
          this.reservasService.liberar(context, id).catch(() => undefined),
        ),
      );
      throw error;
    }
  }

  private async liberarReservas(context: UserContext, pedidoId: string): Promise<void> {
    const activas = await this.reservasService.listar(
      context,
      { source_module: CODIGO_ORIGEN_RESERVA, source_entity_id: pedidoId, released_at: null },
      { page: 1, pageSize: 200 },
    );
    await Promise.all(activas.data.map((r) => this.reservasService.liberar(context, r.id)));
  }

  async crear(context: UserContext, input: CrearPedidoInput): Promise<PedidoConLineas> {
    construirPedido('pendiente', input.companyId, input.branchId, input.customerId, input.lines);
    await this.validarReferencias(
      context,
      input.companyId,
      input.branchId,
      input.customerId,
      input.lines,
    );

    const statusId = await this.resolverEstadoPorCodigo(context, 'pending');
    const { lineasCalculadas, totalAmount } = calcularTotal(input.lines);

    const pedido = await this.pedidoRepository.crear(context, {
      companyId: input.companyId,
      branchId: input.branchId,
      customerId: input.customerId,
      salespersonId: input.salespersonId ?? null,
      statusId,
      salesChannel: 'store',
      currencyCode: input.currencyCode,
      documentNumber: generarNumeroDocumento('PED'),
      totalAmount,
      lines: lineasCalculadas,
    });

    await this.reservarLineas(
      context,
      pedido.id,
      input.warehouseId,
      lineasCalculadas.map((l) => ({ productId: l.productId, quantity: l.quantity })),
    );

    return pedido;
  }

  /** Convierte una cotización aprobada y vigente en un pedido nuevo — copia sus líneas, marca la cotización `converted`. */
  async crearDesdeCotizacion(
    context: UserContext,
    cotizacionId: string,
    warehouseId: string,
  ): Promise<PedidoConLineas> {
    const cotizacion = await this.cotizacionesService.validarConvertible(context, cotizacionId);

    const statusId = await this.resolverEstadoPorCodigo(context, 'pending');
    const lines = cotizacion.quote_lines.map((l) => ({
      productId: l.product_id,
      quantity: Number(l.quantity),
      unitPrice: Number(l.unit_price),
      discountPercentage: Number(l.discount_percentage),
    }));

    const pedido = await this.pedidoRepository.crear(context, {
      companyId: cotizacion.company_id,
      branchId: cotizacion.branch_id,
      customerId: cotizacion.customer_id,
      quoteId: cotizacion.id,
      salespersonId: cotizacion.salesperson_id,
      statusId,
      salesChannel: 'store',
      currencyCode: cotizacion.currency_code,
      documentNumber: generarNumeroDocumento('PED'),
      totalAmount: Number(cotizacion.total_amount),
      lines,
    });

    await this.reservarLineas(
      context,
      pedido.id,
      warehouseId,
      lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
    );
    await this.cotizacionesService.marcarConvertida(context, cotizacionId);

    return pedido;
  }

  async obtener(context: UserContext, id: string): Promise<PedidoConLineas> {
    const pedido = await this.pedidoRepository.obtener(context, id);
    if (!pedido) throw new PedidoNoEncontradoException(id);
    return pedido;
  }

  async listar(
    context: UserContext,
    filtros: { companyId: string; branchId?: string; customerId?: string; statusId?: string },
    pagination: PaginationParams,
    orden?: { campo: OrdenPedido; direccion: 'asc' | 'desc' },
  ): Promise<PaginatedResult<sales_orders>> {
    return this.pedidoRepository.listar(
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

  /** Solo cancelable si ninguna línea tiene facturación parcial/total todavía — libera todas las reservas activas. */
  async cancelar(context: UserContext, id: string): Promise<sales_orders> {
    const pedido = await this.obtener(context, id);
    const tieneFacturacion = pedido.sales_order_lines.some((l) => Number(l.invoiced_quantity) > 0);
    if (tieneFacturacion) throw new PedidoNoCancelableException(id);

    await this.liberarReservas(context, id);
    const statusId = await this.resolverEstadoPorCodigo(context, 'cancelled');
    return this.pedidoRepository.actualizarEstado(context, id, statusId);
  }

  /**
   * Convierte el pedido (total o parcialmente) en una factura real,
   * reutilizando `VentasService.crearFactura` — la factura resultante
   * ya calcula impuesto por línea con la tasa vigente, dispara el
   * motor contable al confirmarse, etc. (mismo motor que Facturación
   * Parte 1). Sin `input.lines`, convierte el saldo pendiente completo
   * de cada línea.
   */
  async convertirAFactura(
    context: UserContext,
    id: string,
    input: ConvertirPedidoAFacturaInput,
  ): Promise<FacturaConLineas> {
    const pedido = await this.obtener(context, id);
    const estadoActual = await this.obtenerCodigoEstado(context, pedido.status_id);
    if (estadoActual === 'cancelled') {
      throw new PedidoInvalidoException(`El pedido "${id}" está cancelado.`);
    }

    const solicitadas = new Map((input.lines ?? []).map((l) => [l.salesOrderLineId, l.quantity]));
    const aFacturar: Array<{
      salesOrderLineId: string;
      productId: string;
      quantity: number;
      unitPrice: number;
      discountPercentage: number;
    }> = [];

    for (const linea of pedido.sales_order_lines) {
      const pendiente = Number(linea.quantity) - Number(linea.invoiced_quantity);
      if (pendiente <= 0) continue;
      const solicitada = solicitadas.has(linea.id) ? solicitadas.get(linea.id)! : pendiente;
      if (input.lines && !solicitadas.has(linea.id)) continue;
      if (solicitada > pendiente) {
        throw new LineaPedidoInvalidaException(
          `La línea "${linea.id}" tiene ${pendiente} unidades pendientes — no puede facturarse ${solicitada}.`,
        );
      }
      aFacturar.push({
        salesOrderLineId: linea.id,
        productId: linea.product_id,
        quantity: solicitada,
        unitPrice: Number(linea.unit_price),
        discountPercentage: Number(linea.discount_percentage),
      });
    }

    if (aFacturar.length === 0) throw new PedidoSinSaldoPendienteException(id);

    const factura = await this.ventasService.crearFactura(context, {
      companyId: pedido.company_id,
      branchId: pedido.branch_id,
      customerId: pedido.customer_id,
      salesChannel: 'store',
      currencyCode: pedido.currency_code,
      generalDiscountPercentage: 0,
      salesOrderId: pedido.id,
      lines: aFacturar.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        discountPercentage: l.discountPercentage,
      })),
    });

    await this.pedidoRepository.registrarFacturacionDeLineas(
      context,
      aFacturar.map((l) => ({ salesOrderLineId: l.salesOrderLineId, cantidad: l.quantity })),
    );

    const pedidoActualizado = await this.obtener(context, id);
    const completo = pedidoActualizado.sales_order_lines.every(
      (l) => Number(l.invoiced_quantity) >= Number(l.quantity),
    );
    const nuevoEstado = await this.resolverEstadoPorCodigo(
      context,
      completo ? 'completed' : 'partial',
    );
    await this.pedidoRepository.actualizarEstado(context, id, nuevoEstado);
    if (completo) await this.liberarReservas(context, id);

    return factura;
  }
}
