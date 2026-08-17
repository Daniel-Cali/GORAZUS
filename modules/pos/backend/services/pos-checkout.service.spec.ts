import type { UserContext } from '@gorazus/contracts';
import {
  StockService,
  MovimientosService,
  TiposMovimientoService,
  AlmacenesService,
} from '@gorazus/modules/inventario';
import { VentasService, type FacturaConLineas } from '@gorazus/modules/ventas';
import {
  CajaService,
  RegistroNoPerteneceASucursalException,
  CajaNoAbiertaException,
} from '@gorazus/modules/caja';
import { ClientesService } from '@gorazus/modules/clientes';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import { CheckoutIdempotencyRepository } from '../repositories/checkout-idempotency.repository';
import {
  PosCheckoutService,
  StockInsuficienteParaVentaException,
  VentaSinPagoSuficienteException,
  IdempotencyKeyReusadaException,
  VentaSuspendidaInvalidaException,
} from './pos-checkout.service';
import type { ConfirmarVentaInput, CompletarVentaSuspendidaInput } from '../validators/pos.schema';

interface FilaIdempotenciaFake {
  id: string;
  idempotency_key: string;
  payload_fingerprint: string;
  status: 'processing' | 'succeeded' | 'failed';
  invoice_id: string | null;
  result: { cambio: number } | null;
  error_code: string | null;
  error_message: string | null;
}

/**
 * Fake en memoria — sin `await` interno antes de leer/escribir el Map, así
 * que `Promise.all([confirmarVenta(...), confirmarVenta(...)])` reproduce
 * fielmente la exclusión mutua real del índice único de Postgres: el
 * primer `confirmarVenta` corre su tramo síncrono (incluida la llamada
 * completa a este fake) antes de que el segundo alcance a leer el Map,
 * exactamente como el `INSERT` real serializa la carrera.
 */
function buildCheckoutIdempotencyRepositoryFake(): {
  repo: CheckoutIdempotencyRepository;
  store: Map<string, FilaIdempotenciaFake>;
} {
  const store = new Map<string, FilaIdempotenciaFake>();
  let contador = 0;
  const repo = {
    intentarReservar: jest.fn(async (_ctx: unknown, key: string, fingerprint: string) => {
      const existente = store.get(key);
      if (existente) return { ganador: false as const, fila: existente };
      contador += 1;
      const fila: FilaIdempotenciaFake = {
        id: `idem-${contador}`,
        idempotency_key: key,
        payload_fingerprint: fingerprint,
        status: 'processing',
        invoice_id: null,
        result: null,
        error_code: null,
        error_message: null,
      };
      store.set(key, fila);
      return { ganador: true as const, id: fila.id };
    }),
    marcarExito: jest.fn(async (_ctx: unknown, id: string, invoiceId: string, cambio: number) => {
      for (const fila of store.values()) {
        if (fila.id === id) {
          fila.status = 'succeeded';
          fila.invoice_id = invoiceId;
          fila.result = { cambio };
        }
      }
    }),
    marcarFallo: jest.fn(
      async (_ctx: unknown, id: string, errorCode: string, errorMessage: string) => {
        for (const fila of store.values()) {
          if (fila.id === id) {
            fila.status = 'failed';
            fila.error_code = errorCode;
            fila.error_message = errorMessage;
          }
        }
      },
    ),
  } as unknown as CheckoutIdempotencyRepository;
  return { repo, store };
}

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

function buildFactura(overrides: Partial<FacturaConLineas> = {}): FacturaConLineas {
  return {
    id: 'f-1',
    company_id: 'company-1',
    branch_id: 'branch-1',
    customer_id: 'cust-1',
    status_id: 'st-draft',
    sales_channel: 'pos',
    total_amount: 100,
    invoice_lines: [],
    ...overrides,
  } as unknown as FacturaConLineas;
}

/** Factura suspendida "canónica" para los tests de completar/cancelar — pos + draft + con líneas reales. */
function buildFacturaSuspendida(overrides: Partial<FacturaConLineas> = {}): FacturaConLineas {
  return buildFactura({
    id: 'f-susp-1',
    invoice_lines: [
      { id: 'il-1', product_id: 'p-1', quantity: 2, unit_price: 50, discount_percentage: 0 },
    ] as unknown as FacturaConLineas['invoice_lines'],
    ...overrides,
  });
}

describe('PosCheckoutService', () => {
  let disponible: number;
  let aperturaActiva: { id: string } | null;
  let factura: FacturaConLineas;
  let stockService: StockService;
  let movimientosService: MovimientosService;
  let tiposMovimientoService: TiposMovimientoService;
  let ventasService: VentasService;
  let cajaService: CajaService;
  let clientesService: ClientesService;
  let productoLookupRepository: ProductoLookupRepository;
  let checkoutIdempotencyRepository: CheckoutIdempotencyRepository;
  let idempotencyStore: Map<string, FilaIdempotenciaFake>;
  let almacenesService: AlmacenesService;
  let facturaSuspendida: FacturaConLineas;

  beforeEach(() => {
    disponible = 100;
    aperturaActiva = { id: 'ap-1' };
    factura = buildFactura();
    facturaSuspendida = buildFacturaSuspendida();

    stockService = {
      obtenerDisponible: jest.fn(async () => ({
        productId: 'p-1',
        warehouseId: 'w-1',
        locationId: null,
        quantityOnHand: disponible,
        quantityReserved: 0,
        quantityAvailable: disponible,
      })),
    } as unknown as StockService;

    movimientosService = {
      registrarLote: jest.fn(async () => []),
    } as unknown as MovimientosService;

    tiposMovimientoService = {
      resolverPorCodigo: jest.fn(async () => 'mt-1'),
    } as unknown as TiposMovimientoService;

    ventasService = {
      crearFactura: jest.fn(async () => factura),
      confirmarFactura: jest.fn(async () => factura),
      anularFactura: jest.fn(async () => ({ ...factura, status_id: 'st-cancelled' })),
      obtener: jest.fn(async () => factura),
      registrarRecibo: jest.fn(async () => ({ id: 'r-1' })),
      listar: jest.fn(async () => ({ data: [], meta: { page: 1, pageSize: 50, total: 0 } })),
      listarEstados: jest.fn(async () => ({
        data: [
          { id: 'st-draft', code: 'draft' },
          { id: 'st-issued', code: 'issued' },
          { id: 'st-cancelled', code: 'cancelled' },
        ],
        meta: { page: 1, pageSize: 50, total: 3 },
      })),
      resolverEstadoPorCodigo: jest.fn(async (_ctx: unknown, code: string) => `st-${code}`),
    } as unknown as VentasService;

    cajaService = {
      obtenerRegistroDeSucursal: jest.fn(async () => ({
        id: 'r-1',
        branch_id: 'branch-1',
        company_id: 'company-1',
      })),
      obtenerAperturaActiva: jest.fn(async () => aperturaActiva),
      registrarMovimiento: jest.fn(async () => ({ id: 'cm-1' })),
    } as unknown as CajaService;

    clientesService = {
      obtenerOCrearConsumidorFinal: jest.fn(async () => ({ id: 'cf-1' })),
    } as unknown as ClientesService;

    productoLookupRepository = {
      buscar: jest.fn(async () => [
        { id: 'p-1', sku: 'TORNILLO-1', listPrice: 10, baseUnitId: 'u-1' },
      ]),
    } as unknown as ProductoLookupRepository;

    const fake = buildCheckoutIdempotencyRepositoryFake();
    checkoutIdempotencyRepository = fake.repo;
    idempotencyStore = fake.store;

    almacenesService = {
      listar: jest.fn(async () => ({
        data: [{ id: 'w-1' }],
        meta: { page: 1, pageSize: 1, total: 1 },
      })),
    } as unknown as AlmacenesService;
  });

  function buildService(): PosCheckoutService {
    return new PosCheckoutService(
      stockService,
      movimientosService,
      tiposMovimientoService,
      ventasService,
      cajaService,
      clientesService,
      productoLookupRepository,
      checkoutIdempotencyRepository,
      almacenesService,
    );
  }

  function completarInput(
    overrides: Partial<CompletarVentaSuspendidaInput> = {},
  ): CompletarVentaSuspendidaInput {
    return {
      idempotencyKey: 'idem-completar-1',
      registerId: 'r-1',
      payments: [{ amount: 100 }],
      ...overrides,
    };
  }

  function baseInput(overrides: Partial<ConfirmarVentaInput> = {}): ConfirmarVentaInput {
    return {
      idempotencyKey: 'idem-key-1',
      companyId: 'company-1',
      branchId: 'branch-1',
      registerId: 'r-1',
      currencyCode: 'USD',
      lines: [
        { productId: 'p-1', warehouseId: 'w-1', quantity: 2, unitPrice: 50, discountPercentage: 0 },
      ],
      payments: [{ amount: 100 }],
      ...overrides,
    };
  }

  it('buscarProductos: delega en el lookup repository', async () => {
    const resultado = await buildService().buscarProductos(CONTEXT, 'TORNILLO');
    expect(productoLookupRepository.buscar).toHaveBeenCalledWith(CONTEXT, 'TORNILLO', 20);
    expect(resultado).toHaveLength(1);
  });

  it('confirmarVenta: rechaza si registerId no pertenece a branchId/companyId (P0-3), sin tocar stock/caja/factura', async () => {
    cajaService.obtenerRegistroDeSucursal = jest.fn(async () => {
      throw new RegistroNoPerteneceASucursalException('r-1', 'branch-1', 'company-1');
    });
    await expect(buildService().confirmarVenta(CONTEXT, baseInput())).rejects.toThrow(
      RegistroNoPerteneceASucursalException,
    );
    expect(stockService.obtenerDisponible).not.toHaveBeenCalled();
    expect(cajaService.obtenerAperturaActiva).not.toHaveBeenCalled();
    expect(ventasService.crearFactura).not.toHaveBeenCalled();
    expect(movimientosService.registrarLote).not.toHaveBeenCalled();
    expect(cajaService.registrarMovimiento).not.toHaveBeenCalled();
  });

  it('confirmarVenta: rechaza si el stock disponible es insuficiente', async () => {
    disponible = 1;
    await expect(buildService().confirmarVenta(CONTEXT, baseInput())).rejects.toThrow(
      StockInsuficienteParaVentaException,
    );
  });

  it('confirmarVenta: rechaza si la caja no tiene apertura activa', async () => {
    aperturaActiva = null;
    await expect(buildService().confirmarVenta(CONTEXT, baseInput())).rejects.toThrow(
      'no tiene una apertura activa',
    );
  });

  it('confirmarVenta: rechaza si el pago no cubre el total', async () => {
    await expect(
      buildService().confirmarVenta(CONTEXT, baseInput({ payments: [{ amount: 50 }] })),
    ).rejects.toThrow(VentaSinPagoSuficienteException);
  });

  it('confirmarVenta: resuelve Consumidor Final si no se indica cliente', async () => {
    await buildService().confirmarVenta(CONTEXT, baseInput());
    expect(clientesService.obtenerOCrearConsumidorFinal).toHaveBeenCalledWith(CONTEXT, 'company-1');
    expect(ventasService.crearFactura).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ customerId: 'cf-1', salesChannel: 'pos' }),
    );
  });

  it('confirmarVenta: usa el cliente indicado sin resolver Consumidor Final', async () => {
    await buildService().confirmarVenta(CONTEXT, baseInput({ customerId: 'cust-real' }));
    expect(clientesService.obtenerOCrearConsumidorFinal).not.toHaveBeenCalled();
    expect(ventasService.crearFactura).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ customerId: 'cust-real' }),
    );
  });

  it('confirmarVenta: caso feliz descuenta stock, registra pago y confirma la factura', async () => {
    const resultado = await buildService().confirmarVenta(CONTEXT, baseInput());
    expect(movimientosService.registrarLote).toHaveBeenCalledWith(
      CONTEXT,
      expect.arrayContaining([
        expect.objectContaining({ productId: 'p-1', quantity: 2, sourceModule: 'pos' }),
      ]),
    );
    expect(ventasService.registrarRecibo).toHaveBeenCalled();
    expect(cajaService.registrarMovimiento).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ registerId: 'r-1', direction: 'in' }),
    );
    expect(ventasService.confirmarFactura).toHaveBeenCalledWith(CONTEXT, 'f-1');
    expect(resultado.cambio).toBe(0);
  });

  it('confirmarVenta: calcula el cambio cuando el pago excede el total', async () => {
    const resultado = await buildService().confirmarVenta(
      CONTEXT,
      baseInput({ payments: [{ amount: 150 }] }),
    );
    expect(resultado.cambio).toBe(50);
  });

  it('confirmarVenta: pago mixto (efectivo + tarjeta) suma ambas líneas sin exigir una sola forma de pago', async () => {
    const resultado = await buildService().confirmarVenta(
      CONTEXT,
      baseInput({
        payments: [
          { paymentFormId: '11111111-1111-1111-1111-111111111111', amount: 60 },
          { paymentFormId: '22222222-2222-2222-2222-222222222222', amount: 40 },
        ],
      }),
    );
    expect(resultado.cambio).toBe(0);
  });

  it('confirmarVenta: propaga la moneda real recibida (currencyCode) a la factura, nunca un valor fijo', async () => {
    await buildService().confirmarVenta(CONTEXT, baseInput({ currencyCode: 'DOP' }));
    expect(ventasService.crearFactura).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ currencyCode: 'DOP' }),
    );
  });

  // --- P0-1: idempotencia de POST /pos/ventas ---

  it('Test 1 — dos requests secuenciales con la misma key y mismo payload: una sola factura, un solo descuento, un solo pago', async () => {
    const service = buildService();
    const primero = await service.confirmarVenta(CONTEXT, baseInput());
    const segundo = await service.confirmarVenta(CONTEXT, baseInput());

    expect(segundo.factura.id).toBe(primero.factura.id);
    expect(ventasService.crearFactura).toHaveBeenCalledTimes(1);
    expect(movimientosService.registrarLote).toHaveBeenCalledTimes(1);
    expect(ventasService.registrarRecibo).toHaveBeenCalledTimes(1);
    expect(cajaService.registrarMovimiento).toHaveBeenCalledTimes(1);
    expect(idempotencyStore.size).toBe(1);
  });

  it('Test 2 — dos requests concurrentes con la misma key y mismo payload: una sola factura, un solo checkout efectivo', async () => {
    const service = buildService();
    const [primero, segundo] = await Promise.all([
      service.confirmarVenta(CONTEXT, baseInput()),
      service.confirmarVenta(CONTEXT, baseInput()),
    ]);

    expect(segundo.factura.id).toBe(primero.factura.id);
    expect(ventasService.crearFactura).toHaveBeenCalledTimes(1);
    expect(movimientosService.registrarLote).toHaveBeenCalledTimes(1);
    expect(cajaService.registrarMovimiento).toHaveBeenCalledTimes(1);
  });

  it('Test 3 — misma key, payload distinto: 409 IdempotencyKeyReusadaException, sin factura/stock/pago nuevos', async () => {
    const service = buildService();
    await service.confirmarVenta(CONTEXT, baseInput());

    await expect(
      service.confirmarVenta(CONTEXT, baseInput({ payments: [{ amount: 250 }] })),
    ).rejects.toThrow(IdempotencyKeyReusadaException);

    expect(ventasService.crearFactura).toHaveBeenCalledTimes(1);
    expect(movimientosService.registrarLote).toHaveBeenCalledTimes(1);
    expect(cajaService.registrarMovimiento).toHaveBeenCalledTimes(1);
  });

  it('Test 4 — el primer request procesa correctamente pero la respuesta se pierde: el retry con la misma key devuelve la factura original sin reprocesar', async () => {
    const service = buildService();
    const primero = await service.confirmarVenta(CONTEXT, baseInput());

    // Simula que la respuesta original nunca llegó al cajero — el frontend
    // reintenta con la MISMA idempotencyKey (mismo payload).
    const retry = await service.confirmarVenta(CONTEXT, baseInput());

    expect(retry.factura.id).toBe(primero.factura.id);
    expect(retry.cambio).toBe(primero.cambio);
    expect(ventasService.crearFactura).toHaveBeenCalledTimes(1);
    // El replay vuelve a pedir la factura real (no una copia guardada) —
    // `obtener` se llama una vez más en el replay, sin volver a ejecutar
    // stock/pagos/confirmación.
    expect(ventasService.confirmarFactura).toHaveBeenCalledTimes(1);
    expect(movimientosService.registrarLote).toHaveBeenCalledTimes(1);
  });

  it('checkout fallido: la clave queda failed y un replay repite el mismo error sin re-ejecutar', async () => {
    disponible = 1; // fuerza StockInsuficienteParaVentaException en ambos intentos
    const service = buildService();

    await expect(service.confirmarVenta(CONTEXT, baseInput())).rejects.toThrow(
      StockInsuficienteParaVentaException,
    );
    expect(stockService.obtenerDisponible).toHaveBeenCalledTimes(1);

    // Replay de la MISMA clave — debe recibir el mismo error sin volver a
    // consultar stock (no se re-ejecuta el checkout).
    await expect(service.confirmarVenta(CONTEXT, baseInput())).rejects.toMatchObject({
      code: 'STOCK_INSUFICIENTE_PARA_VENTA',
    });
    expect(stockService.obtenerDisponible).toHaveBeenCalledTimes(1);
    expect(ventasService.crearFactura).not.toHaveBeenCalled();
  });

  // --- Prompt 3B: ventas suspendidas ---

  it('Test 1 — suspenderVenta: crea la factura sin registrar movimientos ni pagos', async () => {
    await buildService().suspenderVenta(CONTEXT, {
      companyId: 'company-1',
      branchId: 'branch-1',
      registerId: 'r-1',
      currencyCode: 'USD',
      lines: [
        { productId: 'p-1', warehouseId: 'w-1', quantity: 1, unitPrice: 10, discountPercentage: 0 },
      ],
    });
    expect(ventasService.crearFactura).toHaveBeenCalled();
    expect(movimientosService.registrarLote).not.toHaveBeenCalled();
    expect(cajaService.registrarMovimiento).not.toHaveBeenCalled();
  });

  it('Test 2 — recuperarVenta: devuelve la misma factura (no crea nada)', async () => {
    ventasService.obtener = jest.fn(async () => facturaSuspendida);
    const resultado = await buildService().recuperarVenta(CONTEXT, 'f-susp-1');
    expect(resultado.id).toBe('f-susp-1');
    expect(ventasService.crearFactura).not.toHaveBeenCalled();
  });

  it('Test 3 — completarVentaSuspendida: 1 factura, 1 descuento de stock, 1 conjunto de pagos', async () => {
    ventasService.obtener = jest.fn(async () => facturaSuspendida);
    const resultado = await buildService().completarVentaSuspendida(
      CONTEXT,
      'f-susp-1',
      completarInput(),
    );

    expect(resultado.factura.id).toBe('f-susp-1');
    expect(ventasService.crearFactura).not.toHaveBeenCalled(); // Test 4: nunca una segunda factura
    expect(ventasService.confirmarFactura).toHaveBeenCalledWith(CONTEXT, 'f-susp-1');
    expect(movimientosService.registrarLote).toHaveBeenCalledWith(
      CONTEXT,
      expect.arrayContaining([
        expect.objectContaining({
          productId: 'p-1',
          quantity: 2,
          warehouseId: 'w-1',
          sourceModule: 'pos',
        }),
      ]),
    );
    expect(movimientosService.registrarLote).toHaveBeenCalledTimes(1);
    expect(ventasService.registrarRecibo).toHaveBeenCalledTimes(1);
    expect(cajaService.registrarMovimiento).toHaveBeenCalledTimes(1);
  });

  it('Test 5 — stock insuficiente después de suspender: rechaza, no descuento, no cobro', async () => {
    disponible = 1; // menos que las 2 unidades de la línea suspendida
    ventasService.obtener = jest.fn(async () => facturaSuspendida);

    await expect(
      buildService().completarVentaSuspendida(CONTEXT, 'f-susp-1', completarInput()),
    ).rejects.toThrow(StockInsuficienteParaVentaException);

    expect(movimientosService.registrarLote).not.toHaveBeenCalled();
    expect(ventasService.registrarRecibo).not.toHaveBeenCalled();
    expect(ventasService.confirmarFactura).not.toHaveBeenCalled();
  });

  it('Test 6 — pago insuficiente: rechaza, no descuento, no cobro', async () => {
    ventasService.obtener = jest.fn(async () => facturaSuspendida);

    await expect(
      buildService().completarVentaSuspendida(
        CONTEXT,
        'f-susp-1',
        completarInput({ payments: [{ amount: 10 }] }),
      ),
    ).rejects.toThrow(VentaSinPagoSuficienteException);

    expect(movimientosService.registrarLote).not.toHaveBeenCalled();
    expect(ventasService.confirmarFactura).not.toHaveBeenCalled();
  });

  it('Test 7 — caja cerrada: rechaza', async () => {
    aperturaActiva = null;
    ventasService.obtener = jest.fn(async () => facturaSuspendida);

    await expect(
      buildService().completarVentaSuspendida(CONTEXT, 'f-susp-1', completarInput()),
    ).rejects.toThrow(CajaNoAbiertaException);

    expect(movimientosService.registrarLote).not.toHaveBeenCalled();
  });

  it('rechaza si la factura no es una venta POS suspendida válida (canal distinto)', async () => {
    ventasService.obtener = jest.fn(async () =>
      buildFacturaSuspendida({ sales_channel: 'store' } as never),
    );
    await expect(
      buildService().completarVentaSuspendida(CONTEXT, 'f-susp-1', completarInput()),
    ).rejects.toThrow(VentaSuspendidaInvalidaException);
  });

  it('rechaza si la factura ya no está en borrador (ya fue emitida)', async () => {
    ventasService.obtener = jest.fn(async () => buildFacturaSuspendida({ status_id: 'st-issued' }));
    await expect(
      buildService().completarVentaSuspendida(CONTEXT, 'f-susp-1', completarInput()),
    ).rejects.toThrow(VentaSuspendidaInvalidaException);
  });

  it('Test 8 — dos requests simultáneos completando la misma suspendida: 1 emisión, 1 descuento, 1 cobro', async () => {
    ventasService.obtener = jest.fn(async () => facturaSuspendida);
    const service = buildService();

    const [primero, segundo] = await Promise.all([
      service.completarVentaSuspendida(
        CONTEXT,
        'f-susp-1',
        completarInput({ idempotencyKey: 'key-A' }),
      ),
      service.completarVentaSuspendida(
        CONTEXT,
        'f-susp-1',
        completarInput({ idempotencyKey: 'key-B' }),
      ),
    ]);

    // Dos `idempotencyKey` DISTINTAS (dos cajeros, dos terminales) — lo que
    // cierra la carrera es que la reserva usa `invoiceId`, no la key del
    // cliente (ver comentario en `completarVentaSuspendida`).
    expect(primero.factura.id).toBe(segundo.factura.id);
    expect(ventasService.confirmarFactura).toHaveBeenCalledTimes(1);
    expect(movimientosService.registrarLote).toHaveBeenCalledTimes(1);
    expect(cajaService.registrarMovimiento).toHaveBeenCalledTimes(1);
  });

  it('Test 9 — retry de completar con la misma key: mismo resultado, sin reprocesar', async () => {
    ventasService.obtener = jest.fn(async () => facturaSuspendida);
    const service = buildService();

    const primero = await service.completarVentaSuspendida(CONTEXT, 'f-susp-1', completarInput());
    const retry = await service.completarVentaSuspendida(CONTEXT, 'f-susp-1', completarInput());

    expect(retry.factura.id).toBe(primero.factura.id);
    expect(retry.cambio).toBe(primero.cambio);
    expect(ventasService.confirmarFactura).toHaveBeenCalledTimes(1);
    expect(movimientosService.registrarLote).toHaveBeenCalledTimes(1);
  });

  it('Test 10 — suspendida de otro tenant: rechazada, sin efectos secundarios', async () => {
    class FacturaNoEncontradaFake extends Error {}
    ventasService.obtener = jest.fn(async () => {
      // RLS real: una factura de otro tenant simplemente no existe para
      // esta sesión — `VentasService.obtener` lanza `FacturaNoEncontradaException`.
      throw new FacturaNoEncontradaFake('No existe la factura "f-otro-tenant".');
    });

    await expect(
      buildService().completarVentaSuspendida(CONTEXT, 'f-otro-tenant', completarInput()),
    ).rejects.toThrow(FacturaNoEncontradaFake);

    expect(movimientosService.registrarLote).not.toHaveBeenCalled();
    expect(ventasService.registrarRecibo).not.toHaveBeenCalled();
    expect(cajaService.registrarMovimiento).not.toHaveBeenCalled();
    expect(ventasService.confirmarFactura).not.toHaveBeenCalled();
  });

  it('cancelarVentaSuspendida: anula la factura vía Ventas (baja lógica), no la borra', async () => {
    ventasService.obtener = jest.fn(async () => facturaSuspendida);
    await buildService().cancelarVentaSuspendida(CONTEXT, 'f-susp-1');
    expect(ventasService.anularFactura).toHaveBeenCalledWith(CONTEXT, 'f-susp-1');
  });

  it('cancelarVentaSuspendida: rechaza si la factura ya no es una suspendida válida', async () => {
    ventasService.obtener = jest.fn(async () => buildFacturaSuspendida({ status_id: 'st-issued' }));
    await expect(buildService().cancelarVentaSuspendida(CONTEXT, 'f-susp-1')).rejects.toThrow(
      VentaSuspendidaInvalidaException,
    );
    expect(ventasService.anularFactura).not.toHaveBeenCalled();
  });

  it('listarSuspendidas: filtra por status draft y sales_channel pos (bug real de la auditoría, ya corregido)', async () => {
    await buildService().listarSuspendidas(CONTEXT, 'branch-1');
    expect(ventasService.listar).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ branchId: 'branch-1', statusId: 'st-draft', salesChannel: 'pos' }),
      expect.anything(),
    );
  });
});
