import type { UserContext } from '@gorazus/contracts';
import {
  StockService,
  MovimientosService,
  TiposMovimientoService,
} from '@gorazus/modules/inventario';
import { VentasService, type FacturaConLineas } from '@gorazus/modules/ventas';
import { CajaService } from '@gorazus/modules/caja';
import { ClientesService } from '@gorazus/modules/clientes';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import {
  PosCheckoutService,
  StockInsuficienteParaVentaException,
  VentaSinPagoSuficienteException,
} from './pos-checkout.service';
import type { ConfirmarVentaInput } from '../validators/pos.schema';

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
    total_amount: 100,
    invoice_lines: [],
    ...overrides,
  } as unknown as FacturaConLineas;
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

  beforeEach(() => {
    disponible = 100;
    aperturaActiva = { id: 'ap-1' };
    factura = buildFactura();

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
      obtener: jest.fn(async () => factura),
      registrarRecibo: jest.fn(async () => ({ id: 'r-1' })),
      listar: jest.fn(async () => ({ data: [], meta: { page: 1, pageSize: 50, total: 0 } })),
    } as unknown as VentasService;

    cajaService = {
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
    );
  }

  function baseInput(overrides: Partial<ConfirmarVentaInput> = {}): ConfirmarVentaInput {
    return {
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

  it('suspenderVenta: crea la factura sin registrar movimientos ni pagos', async () => {
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
});
