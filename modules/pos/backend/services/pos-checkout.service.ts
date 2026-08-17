import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { pos_checkout_idempotency_keys } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { computeFingerprint } from '@gorazus/tooling/utils';
import {
  StockService,
  MovimientosService,
  TiposMovimientoService,
  AlmacenesService,
} from '@gorazus/modules/inventario';
import { VentasService, type FacturaConLineas } from '@gorazus/modules/ventas';
import { CajaService, CajaNoAbiertaException } from '@gorazus/modules/caja';
import { ClientesService } from '@gorazus/modules/clientes';
import {
  ProductoLookupRepository,
  type ProductoBuscado,
} from '../repositories/producto-lookup.repository';
import { CheckoutIdempotencyRepository } from '../repositories/checkout-idempotency.repository';
import type {
  ConfirmarVentaInput,
  SuspenderVentaInput,
  CompletarVentaSuspendidaInput,
} from '../validators/pos.schema';

/** P0-1 — cuánto espera el perdedor de una reserva de idempotencia a que el ganador termine antes de rendirse con `IdempotencyEnProcesoException`. 8 × 100ms ≈ 800ms, muy por encima de lo que tarda un checkout real (todo en proceso, sin I/O externo lento) pero acotado — nunca bloquea la request indefinidamente. */
const MAX_INTENTOS_ESPERA_PROCESSING = 8;
const INTERVALO_ESPERA_PROCESSING_MS = 100;

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

/** P0-1 — la misma `idempotencyKey` llegó con un payload distinto al de su primer uso. No es un reintento del mismo intento, es un error del cliente (clave reciclada) — nunca se ejecuta el checkout. */
export class IdempotencyKeyReusadaException extends DomainException {
  constructor(idempotencyKey: string) {
    super(
      'IDEMPOTENCY_KEY_REUSADA',
      `La clave de idempotencia "${idempotencyKey}" ya se usó para una venta con datos distintos. Inicie una venta nueva.`,
      409,
    );
  }
}

/** P0-1 — otra request con la misma clave todavía está procesándose (no alcanzó a quedar succeeded/failed). No se ejecuta un segundo checkout en paralelo; el cliente debe reintentar en unos segundos. */
export class IdempotencyEnProcesoException extends DomainException {
  constructor(idempotencyKey: string) {
    super(
      'IDEMPOTENCY_EN_PROCESO',
      `Ya hay un checkout en curso con la clave de idempotencia "${idempotencyKey}". Reintente en unos segundos.`,
      409,
    );
  }
}

/** Ventas suspendidas (Prompt 3B) — la factura existe pero no es una suspendida válida para completar/cancelar en este momento. */
export class VentaSuspendidaInvalidaException extends DomainException {
  constructor(id: string, motivo: string) {
    super(
      'VENTA_SUSPENDIDA_INVALIDA',
      `La factura "${id}" no es una venta suspendida válida para esta operación (${motivo}).`,
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
    private readonly checkoutIdempotencyRepository: CheckoutIdempotencyRepository,
    private readonly almacenesService: AlmacenesService,
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
   * P0-1 (auditoría POS) — punto de entrada público, envuelve
   * `ejecutarCheckout` con idempotencia real:
   *
   * 1. `intentarReservar` — INSERT en `pos_checkout_idempotency_keys`. El
   *    índice único `(tenant_id, idempotency_key)` es la exclusión mutua
   *    real: de dos requests concurrentes con la misma clave, Postgres
   *    serializa el INSERT, uno gana y el otro recibe la fila ya
   *    reservada (nunca corren `ejecutarCheckout` los dos a la vez).
   * 2. Si NO ganó la reserva (la clave ya existía): `resolverReplay`
   *    decide entre devolver el resultado ya confirmado, re-lanzar el
   *    error ya ocurrido, rechazar por payload distinto, o rechazar por
   *    "todavía en proceso" — nunca ejecuta el checkout una segunda vez.
   * 3. Si ganó la reserva: corre `ejecutarCheckout` (la lógica real, sin
   *    cambios de comportamiento) y, al terminar (éxito o error),
   *    completa la fila reservada con el resultado real. Un checkout que
   *    lanza una excepción de dominio (stock insuficiente, pago
   *    insuficiente, caja cerrada, etc.) queda `failed` con ese motivo —
   *    un replay de esa misma clave recibe el mismo error, no un
   *    reintento silencioso.
   */
  async confirmarVenta(context: UserContext, input: ConfirmarVentaInput): Promise<VentaConfirmada> {
    const fingerprint = computeFingerprint({
      companyId: input.companyId,
      branchId: input.branchId,
      registerId: input.registerId,
      customerId: input.customerId ?? null,
      currencyCode: input.currencyCode,
      lines: input.lines,
      payments: input.payments,
    });

    const reserva = await this.checkoutIdempotencyRepository.intentarReservar(
      context,
      input.idempotencyKey,
      fingerprint,
    );

    if (!reserva.ganador) {
      return this.resolverReplay(context, reserva.fila, fingerprint);
    }

    try {
      const resultado = await this.ejecutarCheckout(context, input);
      await this.checkoutIdempotencyRepository.marcarExito(
        context,
        reserva.id,
        resultado.factura.id,
        resultado.cambio,
      );
      return resultado;
    } catch (error) {
      const { code, message } = this.describirError(error);
      await this.checkoutIdempotencyRepository.marcarFallo(context, reserva.id, code, message);
      throw error;
    }
  }

  private describirError(error: unknown): { code: string; message: string } {
    if (error instanceof DomainException) return { code: error.code, message: error.message };
    return {
      code: 'POS_CHECKOUT_ERROR_INESPERADO',
      message: error instanceof Error ? error.message : 'Error inesperado durante el checkout.',
    };
  }

  /**
   * P0-1 — "dos requests simultáneos... la otra debe reutilizar el
   * resultado existente" (no solo un 409 de "reintente"). El perdedor de
   * la reserva espera acotado (`MAX_INTENTOS_ESPERA_PROCESSING` intentos,
   * `INTERVALO_ESPERA_PROCESSING_MS` cada uno) a que el ganador termine,
   * releyendo la fila cada vez — nunca vuelve a ejecutar el checkout. Si
   * el ganador tarda más que la ventana acotada (caso patológico, no el
   * camino normal), recién ahí se rinde con `IdempotencyEnProcesoException`
   * en vez de bloquear la request indefinidamente.
   */
  private async resolverReplay(
    context: UserContext,
    filaInicial: pos_checkout_idempotency_keys,
    fingerprintNuevo: string,
  ): Promise<VentaConfirmada> {
    if (filaInicial.payload_fingerprint !== fingerprintNuevo) {
      throw new IdempotencyKeyReusadaException(filaInicial.idempotency_key);
    }

    let fila = filaInicial;
    for (
      let intento = 0;
      fila.status === 'processing' && intento < MAX_INTENTOS_ESPERA_PROCESSING;
      intento++
    ) {
      await new Promise((resolve) => setTimeout(resolve, INTERVALO_ESPERA_PROCESSING_MS));
      const reintento = await this.checkoutIdempotencyRepository.intentarReservar(
        context,
        fila.idempotency_key,
        fingerprintNuevo,
      );
      if (reintento.ganador) {
        throw new Error(
          `idempotencyKey "${fila.idempotency_key}" se reservó dos veces — no debería ocurrir.`,
        );
      }
      fila = reintento.fila;
    }

    if (fila.status === 'processing') {
      throw new IdempotencyEnProcesoException(fila.idempotency_key);
    }
    if (fila.status === 'failed') {
      throw new DomainException(
        fila.error_code ?? 'POS_CHECKOUT_ERROR_INESPERADO',
        fila.error_message ?? 'El checkout anterior con esta clave de idempotencia falló.',
        409,
      );
    }
    // 'succeeded' — se vuelve a pedir la factura real (nunca se guarda una
    // copia propia, ver `CheckoutIdempotencyRepository`).
    if (!fila.invoice_id) {
      throw new Error(
        `pos_checkout_idempotency_keys "${fila.id}" está succeeded sin invoice_id — no debería ocurrir.`,
      );
    }
    const facturaConfirmada = await this.ventasService.obtener(context, fila.invoice_id);
    const resultado = fila.result as { cambio: number } | null;
    return { factura: facturaConfirmada, cambio: resultado?.cambio ?? 0 };
  }

  /**
   * Venta completa: valida stock real, crea la factura, descuenta stock
   * (`MovimientosService.registrarLote` — bloqueo de filas real, Fase 05
   * Parte 04), registra el/los pago(s) (recibo + movimiento de caja) y
   * confirma la factura (`draft → issued`). `POS_FLOW.md` tiene el
   * detalle paso a paso. Lógica sin cambios respecto de antes de P0-1 —
   * solo se movió a un método privado para que `confirmarVenta` pueda
   * envolverla con la idempotencia.
   */
  private async ejecutarCheckout(
    context: UserContext,
    input: ConfirmarVentaInput,
  ): Promise<VentaConfirmada> {
    // P0-3 (auditoría POS): primer chequeo de todos — confirma que
    // `registerId` realmente pertenece a `branchId`/`companyId` antes de
    // tocar stock, caja o crear ninguna factura. RLS por sí solo no
    // detecta una caja de otra sucursal del mismo tenant/empresa.
    await this.cajaService.obtenerRegistroDeSucursal(
      context,
      input.registerId,
      input.branchId,
      input.companyId,
    );

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

  /**
   * Prompt 3B §3 — bug real confirmado: antes de este fix, `listar()` no
   * recibía ningún filtro de estado/canal, así que devolvía TODAS las
   * facturas de la sucursal (issued/paid/cancelled incluidas), no solo las
   * suspendidas. `sales_channel='pos' AND status='draft'` es la definición
   * de "suspendida" usada en todo este archivo — no existe una columna
   * `suspended` explícita y no se agrega una para esto (§2): una factura
   * `pos`+`draft` solo puede llegar a ese estado por `suspenderVenta`, o
   * (caso raro, ya documentado en la auditoría previa como deuda técnica
   * separada) por un checkout que falló a mitad de camino antes de
   * confirmar — ese caso también aparece acá, deliberadamente: es
   * información real que un cajero/supervisor debería poder ver, no
   * ocultarla la haría invisible por completo.
   */
  async listarSuspendidas(context: UserContext, branchId: string) {
    const draftStatusId = await this.ventasService.resolverEstadoPorCodigo(context, 'draft');
    return this.ventasService.listar(
      context,
      { branchId, statusId: draftStatusId, salesChannel: 'pos' },
      { page: 1, pageSize: 50 },
    );
  }

  async recuperarVenta(context: UserContext, id: string): Promise<FacturaConLineas> {
    return this.ventasService.obtener(context, id);
  }

  /** Valida que una factura ya obtenida sea una venta POS suspendida completable/cancelable — mismo criterio que `listarSuspendidas`. */
  private async validarEsSuspendidaValida(
    context: UserContext,
    factura: FacturaConLineas,
  ): Promise<void> {
    if (factura.sales_channel !== 'pos') {
      throw new VentaSuspendidaInvalidaException(factura.id, 'no es una venta de POS');
    }
    const estados = await this.ventasService.listarEstados(context);
    const codigoEstado = estados.data.find((e) => e.id === factura.status_id)?.code;
    if (codigoEstado !== 'draft') {
      throw new VentaSuspendidaInvalidaException(
        factura.id,
        `estado actual "${codigoEstado ?? 'desconocido'}", se esperaba "draft"`,
      );
    }
    if (factura.invoice_lines.length === 0) {
      throw new VentaSuspendidaInvalidaException(factura.id, 'no tiene líneas');
    }
  }

  /**
   * Prompt 3B — completa una venta suspendida cobrándola contra LA MISMA
   * factura (nunca crea una segunda). Reutiliza el mismo ledger de
   * idempotencia que `confirmarVenta` (§8/§9 del prompt: "no dupliques
   * mecanismos") — la diferencia deliberada es la CLAVE de reserva: acá es
   * el propio `invoiceId`, no `input.idempotencyKey`. Esto es lo que cierra
   * la carrera de dos cajeros completando la MISMA suspendida a la vez
   * (§9/§10): sin importar qué `idempotencyKey` haya generado cada
   * terminal, ambos intentos de completar la factura X colisionan en la
   * MISMA fila del ledger — uno gana, el otro reutiliza el resultado (o
   * recibe 409 si mandó pagos distintos) exactamente vía `resolverReplay`,
   * ya escrito para P0-1, sin duplicar lógica de espera/replay.
   */
  async completarVentaSuspendida(
    context: UserContext,
    invoiceId: string,
    input: CompletarVentaSuspendidaInput,
  ): Promise<VentaConfirmada> {
    const fingerprint = computeFingerprint({ invoiceId, payments: input.payments });

    const reserva = await this.checkoutIdempotencyRepository.intentarReservar(
      context,
      invoiceId,
      fingerprint,
    );

    if (!reserva.ganador) {
      return this.resolverReplay(context, reserva.fila, fingerprint);
    }

    try {
      const resultado = await this.ejecutarCompletarSuspendida(context, invoiceId, input);
      await this.checkoutIdempotencyRepository.marcarExito(
        context,
        reserva.id,
        resultado.factura.id,
        resultado.cambio,
      );
      return resultado;
    } catch (error) {
      const { code, message } = this.describirError(error);
      await this.checkoutIdempotencyRepository.marcarFallo(context, reserva.id, code, message);
      throw error;
    }
  }

  /**
   * `invoice_lines`/la factura ya obtenida son la ÚNICA fuente de verdad
   * (§6) — nunca se reconstruye el carrito desde `input`, que solo trae
   * `registerId`/`payments`. No se permite modificar cantidad/precio/
   * descuento al completar: si el cajero necesita cambiar el carrito, debe
   * cancelar esta suspendida (`cancelarVentaSuspendida`) y empezar una
   * venta nueva — decisión explícita, no un comportamiento inventado.
   */
  private async ejecutarCompletarSuspendida(
    context: UserContext,
    invoiceId: string,
    input: CompletarVentaSuspendidaInput,
  ): Promise<VentaConfirmada> {
    const factura = await this.ventasService.obtener(context, invoiceId);
    await this.validarEsSuspendidaValida(context, factura);

    // Mismo chequeo P0-3 que el checkout normal, pero contra los datos
    // REALES de la factura (company_id/branch_id), nunca contra algo que
    // el cliente pueda mandar — acá el cliente ni siquiera los envía.
    await this.cajaService.obtenerRegistroDeSucursal(
      context,
      input.registerId,
      factura.branch_id,
      factura.company_id,
    );
    const apertura = await this.cajaService.obtenerAperturaActiva(context, input.registerId);
    if (!apertura) throw new CajaNoAbiertaException(input.registerId);

    // Un solo almacén por sucursal (Parte 1, mismo criterio que
    // `pos.page.tsx`) — `invoice_lines` no guarda `warehouse_id` (no existe
    // esa columna), así que se resuelve acá, no se inventa ni se le vuelve
    // a pedir al cliente.
    const almacenes = await this.almacenesService.listar(context, factura.branch_id, {
      page: 1,
      pageSize: 1,
    });
    const warehouseId = almacenes.data[0]?.id;
    if (!warehouseId) {
      throw new VentaSuspendidaInvalidaException(
        factura.id,
        'la sucursal no tiene almacén configurado',
      );
    }

    // Nunca se confía en el stock que había al suspender — se revalida
    // completo, real, ahora mismo (§5).
    for (const linea of factura.invoice_lines) {
      const disponible = await this.stockService.obtenerDisponible(context, {
        productId: linea.product_id,
        warehouseId,
        locationId: undefined,
      });
      if (disponible.quantityAvailable < Number(linea.quantity)) {
        throw new StockInsuficienteParaVentaException(
          linea.product_id,
          disponible.quantityAvailable,
          Number(linea.quantity),
        );
      }
    }

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
      factura.invoice_lines.map((linea) => ({
        productId: linea.product_id,
        warehouseId,
        locationId: undefined,
        movementTypeId,
        quantity: Number(linea.quantity),
        sourceModule: 'pos',
        sourceEntityId: factura.id,
      })),
    );

    for (const pago of input.payments) {
      const recibo = await this.ventasService.registrarRecibo(context, {
        companyId: factura.company_id,
        branchId: factura.branch_id,
        customerId: factura.customer_id,
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

    // Confirma LA MISMA factura — nunca se llama `crearFactura` acá.
    await this.ventasService.confirmarFactura(context, factura.id);
    const facturaConfirmada = await this.ventasService.obtener(context, factura.id);

    return {
      factura: facturaConfirmada,
      cambio: Number((totalPagado - Number(factura.total_amount)).toFixed(4)),
    };
  }

  /**
   * Cancela una venta suspendida — reutiliza `VentasService.anularFactura`
   * (baja lógica del módulo de Ventas, `draft`/`issued` → `cancelled`) en
   * vez de un borrado físico o un mecanismo propio de POS (§11/§15: "no
   * borres físicamente si Ventas usa baja lógica", "no dupliques
   * mecanismos"). Expuesto bajo el permiso de POS (`pos.operar_pos`) para
   * que un cajero pueda cancelar su propia suspendida sin necesitar el
   * permiso más amplio de gestión de Ventas.
   */
  async cancelarVentaSuspendida(
    context: UserContext,
    invoiceId: string,
  ): Promise<FacturaConLineas> {
    const factura = await this.ventasService.obtener(context, invoiceId);
    await this.validarEsSuspendidaValida(context, factura);
    await this.ventasService.anularFactura(context, invoiceId);
    return this.ventasService.obtener(context, invoiceId);
  }
}
