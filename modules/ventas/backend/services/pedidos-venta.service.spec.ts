import type { UserContext } from '@gorazus/contracts';
import type { sales_order_status } from '@gorazus/core-database';
import { ReservasService } from '@gorazus/modules/inventario';
import { PedidoRepository, type PedidoConLineas } from '../repositories/pedido.repository';
import { EstadoPedidoRepository } from '../repositories/estado-pedido.repository';
import { ClienteLookupRepository } from '../repositories/cliente-lookup.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import { EmpresaSucursalLookupRepository } from '../repositories/empresa-sucursal-lookup.repository';
import { CotizacionesService } from './cotizaciones.service';
import { VentasService } from './ventas.service';
import {
  PedidosVentaService,
  PedidoNoCancelableException,
  PedidoSinSaldoPendienteException,
  LineaPedidoInvalidaException,
} from './pedidos-venta.service';
import type { CrearPedidoInput } from '../validators/pedidos.schema';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

function buildPedido(overrides: Partial<PedidoConLineas> = {}): PedidoConLineas {
  return {
    id: 'ped-1',
    company_id: 'company-1',
    branch_id: 'branch-1',
    customer_id: 'cust-1',
    status_id: 'st-pending',
    currency_code: 'USD',
    total_amount: 100,
    sales_order_lines: [
      {
        id: 'l-1',
        product_id: 'p-1',
        quantity: 2,
        unit_price: 50,
        discount_percentage: 0,
        invoiced_quantity: 0,
      },
    ],
    ...overrides,
  } as unknown as PedidoConLineas;
}

describe('PedidosVentaService', () => {
  let pedido: PedidoConLineas;
  let estadosExistentes: sales_order_status[];
  let pedidoRepository: PedidoRepository;
  let estadoPedidoRepository: EstadoPedidoRepository;
  let clienteLookupRepository: ClienteLookupRepository;
  let productoLookupRepository: ProductoLookupRepository;
  let empresaSucursalLookupRepository: EmpresaSucursalLookupRepository;
  let reservasService: ReservasService;
  let cotizacionesService: CotizacionesService;
  let ventasService: VentasService;
  let reservasCreadas: string[];
  let reservasLiberadas: string[];

  beforeEach(() => {
    pedido = buildPedido();
    estadosExistentes = [
      { id: 'st-pending', code: 'pending' } as sales_order_status,
      { id: 'st-partial', code: 'partial' } as sales_order_status,
      { id: 'st-completed', code: 'completed' } as sales_order_status,
      { id: 'st-cancelled', code: 'cancelled' } as sales_order_status,
    ];
    reservasCreadas = [];
    reservasLiberadas = [];

    pedidoRepository = {
      crear: jest.fn(async () => pedido),
      obtener: jest.fn(async () => pedido),
      listar: jest.fn(async () => ({ data: [], meta: { page: 1, pageSize: 20, total: 0 } })),
      actualizarEstado: jest.fn(async (_ctx: unknown, _id: string, statusId: string) => {
        pedido = { ...pedido, status_id: statusId };
        return pedido;
      }),
      registrarFacturacionDeLineas: jest.fn(
        async (
          _ctx: unknown,
          incrementos: Array<{ salesOrderLineId: string; cantidad: number }>,
        ) => {
          pedido = {
            ...pedido,
            sales_order_lines: pedido.sales_order_lines.map((l) => {
              const inc = incrementos.find((i) => i.salesOrderLineId === l.id);
              return inc
                ? { ...l, invoiced_quantity: Number(l.invoiced_quantity) + inc.cantidad }
                : l;
            }),
          } as PedidoConLineas;
        },
      ),
    } as unknown as PedidoRepository;

    estadoPedidoRepository = {
      findById: jest.fn(
        async (_ctx: unknown, { id }: { id: string }) =>
          estadosExistentes.find((e) => e.id === id) ?? null,
      ),
      findMany: jest.fn(async (_ctx: unknown, filter: { code?: string }) => {
        const data = estadosExistentes.filter((e) => !filter.code || e.code === filter.code);
        return { data, meta: { page: 1, pageSize: 1, total: data.length } };
      }),
      create: jest.fn(async (_ctx: unknown, data: { code: string }) => {
        const nuevo = { id: `st-${data.code}`, ...data } as sales_order_status;
        estadosExistentes.push(nuevo);
        return nuevo;
      }),
    } as unknown as EstadoPedidoRepository;

    clienteLookupRepository = {
      existeCliente: jest.fn(async () => true),
    } as unknown as ClienteLookupRepository;

    productoLookupRepository = {
      existeProducto: jest.fn(async () => true),
    } as unknown as ProductoLookupRepository;

    empresaSucursalLookupRepository = {
      existeEmpresa: jest.fn(async () => true),
      existeSucursalDeEmpresa: jest.fn(async () => true),
    } as unknown as EmpresaSucursalLookupRepository;

    reservasService = {
      crear: jest.fn(async (_ctx: unknown, input: { productId: string }) => {
        const id = `res-${reservasCreadas.length + 1}-${input.productId}`;
        reservasCreadas.push(id);
        return { id };
      }),
      liberar: jest.fn(async (_ctx: unknown, id: string) => {
        reservasLiberadas.push(id);
        return { id, released_at: new Date() };
      }),
      listar: jest.fn(async () => ({
        data: reservasCreadas.filter((id) => !reservasLiberadas.includes(id)).map((id) => ({ id })),
        meta: { page: 1, pageSize: 200, total: 0 },
      })),
    } as unknown as ReservasService;

    cotizacionesService = {} as unknown as CotizacionesService;

    ventasService = {
      crearFactura: jest.fn(
        async (_ctx: unknown, input: { lines: Array<{ quantity: number }> }) => ({
          id: 'fac-1',
          subtotal_amount: 0,
          invoice_lines: input.lines,
        }),
      ),
    } as unknown as VentasService;
  });

  function buildService(): PedidosVentaService {
    return new PedidosVentaService(
      pedidoRepository,
      estadoPedidoRepository,
      clienteLookupRepository,
      productoLookupRepository,
      empresaSucursalLookupRepository,
      reservasService,
      cotizacionesService,
      ventasService,
    );
  }

  function baseInput(overrides: Partial<CrearPedidoInput> = {}): CrearPedidoInput {
    return {
      companyId: 'company-1',
      branchId: 'branch-1',
      customerId: 'cust-1',
      currencyCode: 'USD',
      warehouseId: 'wh-1',
      lines: [{ productId: 'p-1', quantity: 2, unitPrice: 50, discountPercentage: 0 }],
      ...overrides,
    };
  }

  it('crear: arranca en pending y reserva cada línea', async () => {
    const service = buildService();
    await service.crear(CONTEXT, baseInput());
    expect(pedidoRepository.crear).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ statusId: 'st-pending' }),
    );
    expect(reservasService.crear).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ productId: 'p-1', quantity: 2, sourceEntityId: 'ped-1' }),
    );
  });

  it('crear: si una reserva falla a mitad de camino, libera las ya creadas', async () => {
    let llamada = 0;
    reservasService.crear = jest.fn(async (_ctx: unknown, input: { productId: string }) => {
      llamada += 1;
      if (llamada === 2) throw new Error('sin capacidad');
      const id = `res-${llamada}-${input.productId}`;
      reservasCreadas.push(id);
      return { id };
    }) as unknown as ReservasService['crear'];

    const service = buildService();
    await expect(
      service.crear(
        CONTEXT,
        baseInput({
          lines: [
            { productId: 'p-1', quantity: 1, unitPrice: 10, discountPercentage: 0 },
            { productId: 'p-2', quantity: 1, unitPrice: 10, discountPercentage: 0 },
          ],
        }),
      ),
    ).rejects.toThrow('sin capacidad');
    expect(reservasLiberadas).toEqual(reservasCreadas);
  });

  it('cancelar: rechaza si alguna línea ya tiene facturación', async () => {
    pedido = buildPedido({
      sales_order_lines: [
        {
          id: 'l-1',
          product_id: 'p-1',
          quantity: 2,
          unit_price: 50,
          discount_percentage: 0,
          invoiced_quantity: 1,
        },
      ],
    } as unknown as Partial<PedidoConLineas>);
    const service = buildService();
    await expect(service.cancelar(CONTEXT, 'ped-1')).rejects.toThrow(PedidoNoCancelableException);
  });

  it('cancelar: libera reservas y marca cancelled', async () => {
    reservasCreadas = ['res-1'];
    const service = buildService();
    const resultado = await service.cancelar(CONTEXT, 'ped-1');
    expect(resultado.status_id).toBe('st-cancelled');
    expect(reservasLiberadas).toEqual(['res-1']);
  });

  it('convertirAFactura: sin lines, factura el saldo pendiente completo y marca completed', async () => {
    reservasCreadas = ['res-1'];
    const service = buildService();
    const factura = await service.convertirAFactura(CONTEXT, 'ped-1', {});
    expect(ventasService.crearFactura).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({
        salesOrderId: 'ped-1',
        lines: [{ productId: 'p-1', quantity: 2, unitPrice: 50, discountPercentage: 0 }],
      }),
    );
    expect(factura.id).toBe('fac-1');
    expect(pedido.status_id).toBe('st-completed');
    expect(reservasLiberadas).toEqual(['res-1']);
  });

  it('convertirAFactura: parcial deja el pedido en partial y no libera reservas', async () => {
    reservasCreadas = ['res-1'];
    const service = buildService();
    await service.convertirAFactura(CONTEXT, 'ped-1', {
      lines: [{ salesOrderLineId: 'l-1', quantity: 1 }],
    });
    expect(pedido.status_id).toBe('st-partial');
    expect(reservasLiberadas).toEqual([]);
  });

  it('convertirAFactura: rechaza pedir más de lo pendiente', async () => {
    const service = buildService();
    await expect(
      service.convertirAFactura(CONTEXT, 'ped-1', {
        lines: [{ salesOrderLineId: 'l-1', quantity: 5 }],
      }),
    ).rejects.toThrow(LineaPedidoInvalidaException);
  });

  it('convertirAFactura: rechaza si ya no queda saldo pendiente', async () => {
    pedido = buildPedido({
      sales_order_lines: [
        {
          id: 'l-1',
          product_id: 'p-1',
          quantity: 2,
          unit_price: 50,
          discount_percentage: 0,
          invoiced_quantity: 2,
        },
      ],
    } as unknown as Partial<PedidoConLineas>);
    const service = buildService();
    await expect(service.convertirAFactura(CONTEXT, 'ped-1', {})).rejects.toThrow(
      PedidoSinSaldoPendienteException,
    );
  });
});
