import type { UserContext } from '@gorazus/contracts';
import type { purchase_invoice_status } from '@gorazus/core-database';
import {
  DevolucionCompraRepository,
  type DevolucionCompraConLineas,
} from '../repositories/devolucion-compra.repository';
import {
  FacturaCompraRepository,
  type FacturaCompraConLineas,
} from '../repositories/factura-compra.repository';
import { EstadoFacturaCompraRepository } from '../repositories/estado-factura-compra.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import {
  DevolucionesCompraService,
  DevolucionCompraNoEncontradaException,
  DevolucionCompraInvalidaException,
  FacturaNoValidaParaDevolucionException,
  CantidadExcedeFacturaException,
} from './devoluciones-compra.service';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

function buildFactura(overrides: Partial<FacturaCompraConLineas> = {}): FacturaCompraConLineas {
  return {
    id: 'fc-1',
    company_id: 'company-1',
    branch_id: 'branch-1',
    status_id: 'st-approved',
    purchase_invoice_lines: [{ id: 'il-1', product_id: 'p-1', quantity: 10, unit_cost: 20 }],
    ...overrides,
  } as unknown as FacturaCompraConLineas;
}

function buildDevolucion(
  overrides: Partial<DevolucionCompraConLineas> = {},
): DevolucionCompraConLineas {
  return {
    id: 'dev-1',
    company_id: 'company-1',
    branch_id: 'branch-1',
    purchase_invoice_id: 'fc-1',
    reason: null,
    purchase_return_lines: [{ id: 'rl-1', product_id: 'p-1', quantity: 4 }],
    ...overrides,
  } as unknown as DevolucionCompraConLineas;
}

describe('DevolucionesCompraService', () => {
  let factura: FacturaCompraConLineas;
  let devolucion: DevolucionCompraConLineas;
  let estadosExistentes: purchase_invoice_status[];
  let productoValido: boolean;
  let cantidadYaDevuelta: number;
  let devolucionCompraRepository: DevolucionCompraRepository;
  let facturaCompraRepository: FacturaCompraRepository;
  let estadoFacturaCompraRepository: EstadoFacturaCompraRepository;
  let productoLookupRepository: ProductoLookupRepository;

  beforeEach(() => {
    factura = buildFactura();
    devolucion = buildDevolucion();
    productoValido = true;
    cantidadYaDevuelta = 0;
    estadosExistentes = [
      { id: 'st-approved', code: 'approved' } as purchase_invoice_status,
      { id: 'st-cancelled', code: 'cancelled' } as purchase_invoice_status,
    ];

    devolucionCompraRepository = {
      crear: jest.fn(async () => devolucion),
      obtener: jest.fn(async () => devolucion),
      listar: jest.fn(async () => ({ data: [], meta: { page: 1, pageSize: 20, total: 0 } })),
      actualizar: jest.fn(async () => devolucion),
      anular: jest.fn(async () => ({ ...devolucion, deleted_at: new Date() })),
      sumarCantidadDevuelta: jest.fn(async () => cantidadYaDevuelta),
    } as unknown as DevolucionCompraRepository;

    facturaCompraRepository = {
      obtener: jest.fn(async () => factura),
    } as unknown as FacturaCompraRepository;

    estadoFacturaCompraRepository = {
      findById: jest.fn(
        async (_ctx: unknown, { id }: { id: string }) =>
          estadosExistentes.find((e) => e.id === id) ?? null,
      ),
    } as unknown as EstadoFacturaCompraRepository;

    productoLookupRepository = {
      existeProducto: jest.fn(async () => productoValido),
    } as unknown as ProductoLookupRepository;
  });

  function buildService(): DevolucionesCompraService {
    return new DevolucionesCompraService(
      devolucionCompraRepository,
      facturaCompraRepository,
      estadoFacturaCompraRepository,
      productoLookupRepository,
    );
  }

  const inputBase = { purchaseInvoiceId: 'fc-1', lines: [{ productId: 'p-1', quantity: 4 }] };

  it('crear: rechaza si la factura no existe', async () => {
    (facturaCompraRepository.obtener as jest.Mock).mockResolvedValueOnce(null);
    await expect(buildService().crear(CONTEXT, inputBase)).rejects.toThrow(
      DevolucionCompraInvalidaException,
    );
  });

  it('crear: rechaza si la factura está cancelada', async () => {
    factura = buildFactura({ status_id: 'st-cancelled' });
    (facturaCompraRepository.obtener as jest.Mock).mockResolvedValue(factura);
    await expect(buildService().crear(CONTEXT, inputBase)).rejects.toThrow(
      FacturaNoValidaParaDevolucionException,
    );
  });

  it('crear: rechaza si el producto no está incluido en la factura', async () => {
    await expect(
      buildService().crear(CONTEXT, {
        purchaseInvoiceId: 'fc-1',
        lines: [{ productId: 'p-x', quantity: 1 }],
      }),
    ).rejects.toThrow('no está incluido en la factura');
  });

  it('crear: rechaza si excede la cantidad facturada', async () => {
    cantidadYaDevuelta = 8;
    await expect(
      buildService().crear(CONTEXT, {
        purchaseInvoiceId: 'fc-1',
        lines: [{ productId: 'p-1', quantity: 5 }],
      }),
    ).rejects.toThrow(CantidadExcedeFacturaException);
  });

  it('crear: acepta devolver exactamente lo que resta (8 ya devueltos, facturado 10, se devuelven 2)', async () => {
    cantidadYaDevuelta = 8;
    const creada = await buildService().crear(CONTEXT, {
      purchaseInvoiceId: 'fc-1',
      lines: [{ productId: 'p-1', quantity: 2 }],
    });
    expect(creada.id).toBe('dev-1');
  });

  it('crear: rechaza una devolución sin líneas (invariante de entidad)', async () => {
    await expect(
      buildService().crear(CONTEXT, { purchaseInvoiceId: 'fc-1', lines: [] }),
    ).rejects.toThrow('al menos una línea');
  });

  it('obtener: devolución inexistente lanza DevolucionCompraNoEncontradaException', async () => {
    (devolucionCompraRepository.obtener as jest.Mock).mockResolvedValueOnce(null);
    await expect(buildService().obtener(CONTEXT, 'no-existe')).rejects.toThrow(
      DevolucionCompraNoEncontradaException,
    );
  });

  it('actualizar: excluye la propia devolución al sumar cantidad ya devuelta', async () => {
    await buildService().actualizar(CONTEXT, 'dev-1', {
      lines: [{ productId: 'p-1', quantity: 9 }],
    });
    expect(devolucionCompraRepository.sumarCantidadDevuelta).toHaveBeenCalledWith(
      CONTEXT,
      'fc-1',
      'p-1',
      'dev-1',
    );
  });

  it('anular: verifica existencia antes de anular', async () => {
    await buildService().anular(CONTEXT, 'dev-1');
    expect(devolucionCompraRepository.anular).toHaveBeenCalledWith(CONTEXT, 'dev-1');
  });
});
