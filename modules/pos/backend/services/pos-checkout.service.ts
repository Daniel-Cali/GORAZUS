import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import { DomainException } from '@gorazus/core-http';
import {
  StockService,
  MovimientosService,
  TiposMovimientoService,
} from '@gorazus/modules/inventario';
import { VentasService, type FacturaConLineas } from '@gorazus/modules/ventas';
import { CajaService, CajaNoAbiertaException } from '@gorazus/modules/caja';
import { ClientesService } from '@gorazus/modules/clientes';
import {
  ProductoLookupRepository,
  type ProductoBuscado,
} from '../repositories/producto-lookup.repository';
import type { ConfirmarVentaInput, SuspenderVentaInput } from '../validators/pos.schema';

/** Código del tipo de movimiento de stock (`inventory.stock_movement_types`) para la salida por venta de mostrador. */
const CODIGO_TIPO_MOVIMIENTO_STOCK_VENTA = 'salida_venta_pos';
/** Código del tipo de movimiento de caja (`cash.cash_movement_types`) para el cobro de una venta de mostrador — catálogo distinto del anterior, mismo prefijo por legibilidad. */
const CODIGO_TIPO_MOVIMIENTO_CAJA_VENTA = 'cobro_venta_pos';

export class StockInsuficienteParaVentaException extends DomainException {
  constructor(productId: string, disponible: number, solicitado: number) {
    super(
      'STOCK_INSUFICIENTE_PARA_VENTA',
      `Stock insuficiente para el producto "${productId}": disponible ${disponible}, solicitado ${solicitado}.`,
      409,
    );
  }
}

export class VentaSinPagoSuficienteException extends DomainException {
  constructor(totalFactura: number, totalPagado: number) {
    super(
      'VENTA_SIN_PAGO_SUFICIENTE',
      `El total pagado (${totalPagado}) no cubre el total de la venta (${totalFactura}).`,
      409,
    );
  }
}

export interface VentaConfirmada {
  factura: FacturaConLineas;
  cambio: number;
}

/**
 * Orquestador del checkout de POS (`POS_ARCHITECTURE.md §4.3`) — sin
 * tablas propias, compone los servicios reales de `inventario`/`ventas`/
 * `caja`/`clientes` vía los barrels públicos de cada módulo (NestJS DI
 * real, nunca importando por ruta profunda — `@nx/enforce-module-boundaries`).
 *
 * **Límite real, no atómico entre schemas**: cada Prisma Client es
 * independiente por schema (`sales`/`inventory`/`cash`), así que esto
 * NO es una única transacción de base de datos — es una orquestación
 * secuencial (best-effort) de transacciones más chicas, cada una
 * atómica en sí misma. Documentado como deuda técnica real
 * (`TECHNICAL_DEBT.md`), no una garantía inventada.
 */
@Injectable()
export class PosCheckoutService {
  constructor(
    private readonly stockService: StockService,
    private readonly movimientosService: MovimientosService,
    private readonly tiposMovimientoService: TiposMovimientoService,
    private readonly ventasService: VentasService,
    private readonly cajaService: CajaService,
    private readonly clientesService: ClientesService,
    private readonly productoLookupRepository: ProductoLookupRepository,
  ) {}

  async buscarProductos(context: UserContext, query: string): Promise<ProductoBuscado[]> {
    return this.productoLookupRepository.buscar(context, query, 20);
  }

  private async validarStockDisponible(
    context: UserContext,
    lines: ConfirmarVentaInput['lines'],
  ): Promise<void> {
    for (const linea of lines) {
      const disponible = await this.stockService.obtenerDisponible(context, {
        productId: linea.productId,
        warehouseId: linea.warehouseId,
        locationId: linea.locationId,
      });
      if (disponible.quantityAvailable < linea.quantity) {
        throw new StockInsuficienteParaVentaException(
          linea.productId,
          disponible.quantityAvailable,
          linea.quantity,
        );
      }
    }
  }

  private async resolverCliente(
    context: UserContext,
    companyId: string,
    customerId: string | undefined,
  ): Promise<string> {
    if (customerId) return customerId;
    const consumidorFinal = await this.clientesService.obtenerOCrearConsumidorFinal(
      context,
      companyId,
    );
    return consumidorFinal.id;
  }

  /**
   * Venta completa: valida stock real, crea la factura, descuenta stock
   * (`MovimientosService.registrarLote` — bloqueo de filas real, Fase 05
   * Parte 04), registra el/los pago(s) (recibo + movimiento de caja) y
   * confirma la factura (`draft → issued`). `POS_FLOW.md` tiene el
   * detalle paso a paso.
   */
  async confirmarVenta(context: UserContext, input: ConfirmarVentaInput): Promise<VentaConfirmada> {
    await this.validarStockDisponible(context, input.lines);

    // Se valida ANTES de crear la factura — `CajaService.registrarMovimiento`
    // ya lo valida internamente más adelante, pero hacerlo acá primero
    // evita dejar una factura `draft` huérfana si la caja está cerrada.
    const apertura = await this.cajaService.obtenerAperturaActiva(context, input.registerId);
    if (!apertura) throw new CajaNoAbiertaException(input.registerId);

    const customerId = await this.resolverCliente(context, input.companyId, input.customerId);

    const factura = await this.ventasService.crearFactura(context, {
      companyId: input.companyId,
      branchId: input.branchId,
      customerId,
      salesChannel: 'pos',
      currencyCode: input.currencyCode,
      lines: input.lines.map((linea) => ({
        productId: linea.productId,
        taxId: linea.taxId,
        quantity: linea.quantity,
        unitPrice: linea.unitPrice,
        discountPercentage: linea.discountPercentage,
      })),
    });

    const totalPagado = input.payments.reduce((acc, pago) => acc + pago.amount, 0);
    if (totalPagado < Number(factura.total_amount)) {
      throw new VentaSinPagoSuficienteException(Number(factura.total_amount), totalPagado);
    }

    const movementTypeId = await this.tiposMovimientoService.resolverPorCodigo(
      context,
      CODIGO_TIPO_MOVIMIENTO_STOCK_VENTA,
      'out',
    );
    await this.movimientosService.registrarLote(
      context,
      input.lines.map((linea) => ({
        productId: linea.productId,
        warehouseId: linea.warehouseId,
        locationId: linea.locationId,
        movementTypeId,
        quantity: linea.quantity,
        sourceModule: 'pos',
        sourceEntityId: factura.id,
      })),
    );

    for (const pago of input.payments) {
      const recibo = await this.ventasService.registrarRecibo(context, {
        companyId: input.companyId,
        branchId: input.branchId,
        customerId,
        invoiceId: factura.id,
        paymentFormId: pago.paymentFormId ?? null,
        amount: pago.amount,
      });
      await this.cajaService.registrarMovimiento(context, {
        registerId: input.registerId,
        movementTypeCode: CODIGO_TIPO_MOVIMIENTO_CAJA_VENTA,
        direction: 'in',
        amount: pago.amount,
        sourceModule: 'pos',
        sourceEntityId: recibo.id,
      });
    }

    await this.ventasService.confirmarFactura(context, factura.id);
    const facturaConfirmada = await this.ventasService.obtener(context, factura.id);

    return {
      factura: facturaConfirmada,
      cambio: Number((totalPagado - Number(factura.total_amount)).toFixed(4)),
    };
  }

  /**
   * Venta suspendida = factura `draft` sin pagos y sin descuento de
   * stock todavía (`POS_FLOW.md`, "Suspender / recuperar venta") — el
   * descuento real ocurre recién en `confirmarVenta` de la venta
   * recuperada.
   */
  async suspenderVenta(
    context: UserContext,
    input: SuspenderVentaInput,
  ): Promise<FacturaConLineas> {
    const customerId = await this.resolverCliente(context, input.companyId, input.customerId);
    return this.ventasService.crearFactura(context, {
      companyId: input.companyId,
      branchId: input.branchId,
      customerId,
      salesChannel: 'pos',
      currencyCode: input.currencyCode,
      lines: input.lines.map((linea) => ({
        productId: linea.productId,
        taxId: linea.taxId,
        quantity: linea.quantity,
        unitPrice: linea.unitPrice,
        discountPercentage: linea.discountPercentage,
      })),
    });
  }

  async listarSuspendidas(context: UserContext, branchId: string) {
    return this.ventasService.listar(context, branchId, { page: 1, pageSize: 50 });
  }

  async recuperarVenta(context: UserContext, id: string): Promise<FacturaConLineas> {
    return this.ventasService.obtener(context, id);
  }
}
