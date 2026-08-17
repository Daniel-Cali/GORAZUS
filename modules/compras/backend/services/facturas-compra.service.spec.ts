import type { UserContext } from '@gorazus/contracts';
import type { purchase_invoice_status } from '@gorazus/core-database';
import {
  FacturaCompraRepository,
  type FacturaCompraConLineas,
} from '../repositories/factura-compra.repository';
import { EstadoFacturaCompraRepository } from '../repositories/estado-factura-compra.repository';
import { HistorialEstadoFacturaRepository } from '../repositories/historial-estado-factura.repository';
import { ProveedorLookupRepository } from '../repositories/proveedor-lookup.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import { OrdenCompraRepository } from '../repositories/orden-compra.repository';
import {
  FacturasCompraService,
  FacturaCompraNoEncontradaException,
  FacturaCompraDuplicadaException,
  FacturaCompraNoEsBorradorException,
  FacturaCompraTransicionInvalidaException,
} from './facturas-compra.service';
import type { CrearFacturaCompraInput } from '../validators/facturas-compra.schema';

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
    supplier_id: 'sup-1',
    supplier_document_number: 'FACT-001',
    purchase_order_id: null,
    status_id: 'st-draft',
    currency_code: 'USD',
    subtotal_amount: 100,
    tax_amount: 0,
    total_amount: 100,
    purchase_invoice_lines: [{ id: 'l-1', product_id: 'p-1', quantity: 5, unit_cost: 20 }],
    ...overrides,
  } as unknown as FacturaCompraConLineas;
}

describe('FacturasCompraService', () => {
  let factura: FacturaCompraConLineas;
  let estadosExistentes: purchase_invoice_status[];
  let proveedorLookup: { id: string; isBlocked: boolean } | null;
  let productoValido: boolean;
  let ordenExiste: boolean;
  let duplicada: boolean;
  let facturaCompraRepository: FacturaCompraRepository;
  let estadoFacturaCompraRepository: EstadoFacturaCompraRepository;
  let historialEstadoFacturaRepository: HistorialEstadoFacturaRepository;
  let proveedorLookupRepository: ProveedorLookupRepository;
  let productoLookupRepository: ProductoLookupRepository;
  let ordenCompraRepository: OrdenCompraRepository;

  beforeEach(() => {
    factura = buildFactura();
    proveedorLookup = { id: 'sup-1', isBlocked: false };
    productoValido = true;
    ordenExiste = true;
    duplicada = false;
    estadosExistentes = [
      { id: 'st-draft', code: 'draft' } as purchase_invoice_status,
      { id: 'st-approved', code: 'approved' } as purchase_invoice_status,
      { id: 'st-posted', code: 'posted' } as purchase_invoice_status,
      { id: 'st-cancelled', code: 'cancelled' } as purchase_invoice_status,
    ];

    facturaCompraRepository = {
      crear: jest.fn(async () => factura),
      obtener: jest.fn(async () => factura),
      listar: jest.fn(async () => ({ data: [], meta: { page: 1, pageSize: 20, total: 0 } })),
      actualizarEstado: jest.fn(async (_ctx: unknown, _id: string, statusId: string) => {
        factura = { ...factura, status_id: statusId };
        return factura;
      }),
      actualizar: jest.fn(async () => factura),
      eliminar: jest.fn(async () => ({ ...factura, deleted_at: new Date() })),
      existeConReferencia: jest.fn(async () => duplicada),
    } as unknown as FacturaCompraRepository;

    estadoFacturaCompraRepository = {
      findById: jest.fn(
        async (_ctx: unknown, { id }: { id: string }) =>
          estadosExistentes.find((e) => e.id === id) ?? null,
      ),
      findMany: jest.fn(async (_ctx: unknown, filter: { code?: string }) => {
        const data = estadosExistentes.filter((e) => !filter.code || e.code === filter.code);
        return { data, meta: { page: 1, pageSize: 1, total: data.length } };
      }),
      create: jest.fn(async (_ctx: unknown, data: { code: string }) => {
        const nuevo = { id: `st-${data.code}`, code: data.code } as purchase_invoice_status;
        estadosExistentes.push(nuevo);
        return nuevo;
      }),
    } as unknown as EstadoFacturaCompraRepository;

    historialEstadoFacturaRepository = {
      registrar: jest.fn(async (_ctx: unknown, params: unknown) => params),
      listar: jest.fn(async () => []),
    } as unknown as HistorialEstadoFacturaRepository;

    proveedorLookupRepository = {
      obtenerProveedor: jest.fn(async () => proveedorLookup),
    } as unknown as ProveedorLookupRepository;

    productoLookupRepository = {
      existeProducto: jest.fn(async () => productoValido),
    } as unknown as ProductoLookupRepository;

    ordenCompraRepository = {
      obtener: jest.fn(async () => (ordenExiste ? { id: 'oc-1' } : null)),
    } as unknown as OrdenCompraRepository;
  });

  function buildService(): FacturasCompraService {
    return new FacturasCompraService(
      facturaCompraRepository,
      estadoFacturaCompraRepository,
      historialEstadoFacturaRepository,
      proveedorLookupRepository,
      productoLookupRepository,
      ordenCompraRepository,
    );
  }

  const inputBase: CrearFacturaCompraInput = {
    companyId: 'company-1',
    supplierId: 'sup-1',
    supplierDocumentNumber: 'FACT-001',
    currencyCode: 'USD',
    lines: [{ productId: 'p-1', quantity: 5, unitCost: 20 }],
  };

  it('crear: rechaza si el proveedor no existe', async () => {
    proveedorLookup = null;
    await expect(buildService().crear(CONTEXT, inputBase)).rejects.toThrow(
      'No existe el proveedor',
    );
  });

  it('crear: NO rechaza por proveedor bloqueado (a diferencia de Purchase Order)', async () => {
    proveedorLookup = { id: 'sup-1', isBlocked: true };
    const creada = await buildService().crear(CONTEXT, inputBase);
    expect(creada.id).toBe('fc-1');
  });

  it('crear: rechaza si la orden de compra indicada no existe', async () => {
    ordenExiste = false;
    await expect(
      buildService().crear(CONTEXT, { ...inputBase, purchaseOrderId: 'oc-x' }),
    ).rejects.toThrow('No existe la orden de compra');
  });

  it('crear: rechaza si un producto de línea no existe', async () => {
    productoValido = false;
    await expect(buildService().crear(CONTEXT, inputBase)).rejects.toThrow('No existe el producto');
  });

  it('crear: rechaza referencia fiscal duplicada', async () => {
    duplicada = true;
    await expect(buildService().crear(CONTEXT, inputBase)).rejects.toThrow(
      FacturaCompraDuplicadaException,
    );
  });

  it('crear: rechaza una factura sin líneas (invariante de entidad)', async () => {
    await expect(buildService().crear(CONTEXT, { ...inputBase, lines: [] })).rejects.toThrow(
      'al menos una línea',
    );
  });

  it('crear: caso feliz — calcula subtotal/total sin impuesto y registra historial', async () => {
    const creada = await buildService().crear(CONTEXT, inputBase);
    expect(creada.id).toBe('fc-1');
    expect(facturaCompraRepository.crear).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ subtotalAmount: 100, taxAmount: 0, totalAmount: 100 }),
    );
    expect(historialEstadoFacturaRepository.registrar).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ purchaseInvoiceId: 'fc-1', statusId: 'st-draft' }),
    );
  });

  it('obtener: factura inexistente lanza FacturaCompraNoEncontradaException', async () => {
    (facturaCompraRepository.obtener as jest.Mock).mockResolvedValueOnce(null);
    await expect(buildService().obtener(CONTEXT, 'no-existe')).rejects.toThrow(
      FacturaCompraNoEncontradaException,
    );
  });

  it('actualizar: rechaza si ya no está en borrador', async () => {
    factura = buildFactura({ status_id: 'st-approved' });
    (facturaCompraRepository.obtener as jest.Mock).mockResolvedValue(factura);
    await expect(
      buildService().actualizar(CONTEXT, 'fc-1', { lines: inputBase.lines }),
    ).rejects.toThrow(FacturaCompraNoEsBorradorException);
  });

  it('eliminar: rechaza si ya no está en borrador', async () => {
    factura = buildFactura({ status_id: 'st-posted' });
    (facturaCompraRepository.obtener as jest.Mock).mockResolvedValue(factura);
    await expect(buildService().eliminar(CONTEXT, 'fc-1')).rejects.toThrow(
      FacturaCompraNoEsBorradorException,
    );
  });

  it('aprobar: draft → approved', async () => {
    const actualizada = await buildService().aprobar(CONTEXT, 'fc-1');
    expect(actualizada.status_id).toBe('st-approved');
  });

  it('contabilizar: rechaza si no está approved', async () => {
    await expect(buildService().contabilizar(CONTEXT, 'fc-1')).rejects.toThrow(
      FacturaCompraTransicionInvalidaException,
    );
  });

  it('contabilizar: approved → posted', async () => {
    factura = buildFactura({ status_id: 'st-approved' });
    (facturaCompraRepository.obtener as jest.Mock).mockResolvedValue(factura);
    const actualizada = await buildService().contabilizar(CONTEXT, 'fc-1');
    expect(actualizada.status_id).toBe('st-posted');
  });

  it('cancelar: rechaza desde posted ("no modificar facturas contabilizadas")', async () => {
    factura = buildFactura({ status_id: 'st-posted' });
    (facturaCompraRepository.obtener as jest.Mock).mockResolvedValue(factura);
    await expect(buildService().cancelar(CONTEXT, 'fc-1')).rejects.toThrow(
      FacturaCompraTransicionInvalidaException,
    );
  });

  it('cancelar: permitido desde draft y desde approved', async () => {
    const cancelada1 = await buildService().cancelar(CONTEXT, 'fc-1');
    expect(cancelada1.status_id).toBe('st-cancelled');

    factura = buildFactura({ status_id: 'st-approved' });
    (facturaCompraRepository.obtener as jest.Mock).mockResolvedValue(factura);
    const cancelada2 = await buildService().cancelar(CONTEXT, 'fc-1');
    expect(cancelada2.status_id).toBe('st-cancelled');
  });

  it('historial: delega en el repositorio de historial tras verificar existencia', async () => {
    await buildService().historial(CONTEXT, 'fc-1');
    expect(historialEstadoFacturaRepository.listar).toHaveBeenCalledWith(CONTEXT, 'fc-1');
  });
});
