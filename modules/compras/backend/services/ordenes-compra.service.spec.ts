import type { UserContext } from '@gorazus/contracts';
import type { purchase_order_status } from '@gorazus/core-database';
import {
  OrdenCompraRepository,
  type OrdenCompraConLineas,
} from '../repositories/orden-compra.repository';
import { EstadoOrdenCompraRepository } from '../repositories/estado-orden-compra.repository';
import { HistorialEstadoOrdenRepository } from '../repositories/historial-estado-orden.repository';
import { EmpresaSucursalLookupRepository } from '../repositories/empresa-sucursal-lookup.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import { ProveedorLookupRepository } from '../repositories/proveedor-lookup.repository';
import { SolicitudCompraRepository } from '../repositories/solicitud-compra.repository';
import {
  OrdenesCompraService,
  OrdenCompraNoEncontradaException,
  OrdenCompraInvalidaException,
  ProveedorBloqueadoException,
  OrdenCompraNoEsBorradorException,
  OrdenCompraTransicionInvalidaException,
} from './ordenes-compra.service';
import type { CrearOrdenCompraInput } from '../validators/ordenes-compra.schema';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

function buildOrden(overrides: Partial<OrdenCompraConLineas> = {}): OrdenCompraConLineas {
  return {
    id: 'oc-1',
    company_id: 'company-1',
    branch_id: 'branch-1',
    supplier_id: 'sup-1',
    requisition_id: null,
    status_id: 'st-draft',
    currency_code: 'USD',
    total_amount: 250,
    document_number: 'OC-1',
    purchase_order_lines: [{ id: 'l-1', product_id: 'p-1', quantity: 10, unit_price: 25 }],
    ...overrides,
  } as unknown as OrdenCompraConLineas;
}

describe('OrdenesCompraService', () => {
  let orden: OrdenCompraConLineas;
  let estadosExistentes: purchase_order_status[];
  let empresaValida: boolean;
  let sucursalValida: boolean;
  let productoValido: boolean;
  let proveedorLookup: { id: string; isBlocked: boolean } | null;
  let solicitudExiste: boolean;
  let ordenCompraRepository: OrdenCompraRepository;
  let estadoOrdenCompraRepository: EstadoOrdenCompraRepository;
  let historialEstadoOrdenRepository: HistorialEstadoOrdenRepository;
  let empresaSucursalLookupRepository: EmpresaSucursalLookupRepository;
  let productoLookupRepository: ProductoLookupRepository;
  let proveedorLookupRepository: ProveedorLookupRepository;
  let solicitudCompraRepository: SolicitudCompraRepository;

  beforeEach(() => {
    orden = buildOrden();
    empresaValida = true;
    sucursalValida = true;
    productoValido = true;
    proveedorLookup = { id: 'sup-1', isBlocked: false };
    solicitudExiste = true;
    estadosExistentes = [
      { id: 'st-draft', code: 'draft' } as purchase_order_status,
      { id: 'st-approved', code: 'approved' } as purchase_order_status,
      { id: 'st-cancelled', code: 'cancelled' } as purchase_order_status,
    ];

    ordenCompraRepository = {
      crear: jest.fn(async () => orden),
      obtener: jest.fn(async () => orden),
      listar: jest.fn(async () => ({ data: [], meta: { page: 1, pageSize: 20, total: 0 } })),
      actualizarEstado: jest.fn(async (_ctx: unknown, _id: string, statusId: string) => {
        orden = { ...orden, status_id: statusId };
        return orden;
      }),
      actualizar: jest.fn(async () => orden),
      eliminar: jest.fn(async () => ({ ...orden, deleted_at: new Date() })),
    } as unknown as OrdenCompraRepository;

    estadoOrdenCompraRepository = {
      findById: jest.fn(
        async (_ctx: unknown, { id }: { id: string }) =>
          estadosExistentes.find((e) => e.id === id) ?? null,
      ),
      findMany: jest.fn(async (_ctx: unknown, filter: { code?: string }) => {
        const data = estadosExistentes.filter((e) => !filter.code || e.code === filter.code);
        return { data, meta: { page: 1, pageSize: 1, total: data.length } };
      }),
      create: jest.fn(async (_ctx: unknown, data: { code: string }) => {
        const nuevo = { id: `st-${data.code}`, code: data.code } as purchase_order_status;
        estadosExistentes.push(nuevo);
        return nuevo;
      }),
    } as unknown as EstadoOrdenCompraRepository;

    historialEstadoOrdenRepository = {
      registrar: jest.fn(async (_ctx: unknown, params: unknown) => params),
      listar: jest.fn(async () => []),
    } as unknown as HistorialEstadoOrdenRepository;

    empresaSucursalLookupRepository = {
      existeEmpresa: jest.fn(async () => empresaValida),
      existeSucursalDeEmpresa: jest.fn(async () => sucursalValida),
    } as unknown as EmpresaSucursalLookupRepository;

    productoLookupRepository = {
      existeProducto: jest.fn(async () => productoValido),
    } as unknown as ProductoLookupRepository;

    proveedorLookupRepository = {
      obtenerProveedor: jest.fn(async () => proveedorLookup),
    } as unknown as ProveedorLookupRepository;

    solicitudCompraRepository = {
      obtener: jest.fn(async () => (solicitudExiste ? { id: 'req-1' } : null)),
    } as unknown as SolicitudCompraRepository;
  });

  function buildService(): OrdenesCompraService {
    return new OrdenesCompraService(
      ordenCompraRepository,
      estadoOrdenCompraRepository,
      historialEstadoOrdenRepository,
      empresaSucursalLookupRepository,
      productoLookupRepository,
      proveedorLookupRepository,
      solicitudCompraRepository,
    );
  }

  const inputBase: CrearOrdenCompraInput = {
    companyId: 'company-1',
    branchId: 'branch-1',
    supplierId: 'sup-1',
    currencyCode: 'USD',
    lines: [{ productId: 'p-1', quantity: 10, unitPrice: 25 }],
  };

  it('crear: rechaza si la empresa no existe', async () => {
    empresaValida = false;
    await expect(buildService().crear(CONTEXT, inputBase)).rejects.toThrow(
      OrdenCompraInvalidaException,
    );
  });

  it('crear: rechaza si el proveedor no existe', async () => {
    proveedorLookup = null;
    await expect(buildService().crear(CONTEXT, inputBase)).rejects.toThrow(
      'No existe el proveedor',
    );
  });

  it('crear: rechaza si el proveedor está bloqueado', async () => {
    proveedorLookup = { id: 'sup-1', isBlocked: true };
    await expect(buildService().crear(CONTEXT, inputBase)).rejects.toThrow(
      ProveedorBloqueadoException,
    );
  });

  it('crear: rechaza si la solicitud de compra indicada no existe', async () => {
    solicitudExiste = false;
    await expect(
      buildService().crear(CONTEXT, { ...inputBase, requisitionId: 'req-x' }),
    ).rejects.toThrow('No existe la solicitud de compra');
  });

  it('crear: rechaza si un producto de línea no existe', async () => {
    productoValido = false;
    await expect(buildService().crear(CONTEXT, inputBase)).rejects.toThrow('No existe el producto');
  });

  it('crear: rechaza una orden sin líneas (invariante de entidad)', async () => {
    await expect(buildService().crear(CONTEXT, { ...inputBase, lines: [] })).rejects.toThrow(
      'al menos una línea',
    );
  });

  it('crear: caso feliz — registra historial de la transición inicial', async () => {
    const creada = await buildService().crear(CONTEXT, inputBase);
    expect(creada.id).toBe('oc-1');
    expect(historialEstadoOrdenRepository.registrar).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ purchaseOrderId: 'oc-1', statusId: 'st-draft' }),
    );
  });

  it('obtener: orden inexistente lanza OrdenCompraNoEncontradaException', async () => {
    (ordenCompraRepository.obtener as jest.Mock).mockResolvedValueOnce(null);
    await expect(buildService().obtener(CONTEXT, 'no-existe')).rejects.toThrow(
      OrdenCompraNoEncontradaException,
    );
  });

  it('actualizar: rechaza si ya no está en borrador', async () => {
    orden = buildOrden({ status_id: 'st-approved' });
    (ordenCompraRepository.obtener as jest.Mock).mockResolvedValue(orden);
    await expect(
      buildService().actualizar(CONTEXT, 'oc-1', { lines: inputBase.lines }),
    ).rejects.toThrow(OrdenCompraNoEsBorradorException);
  });

  it('eliminar: rechaza si ya no está en borrador', async () => {
    orden = buildOrden({ status_id: 'st-approved' });
    (ordenCompraRepository.obtener as jest.Mock).mockResolvedValue(orden);
    await expect(buildService().eliminar(CONTEXT, 'oc-1')).rejects.toThrow(
      OrdenCompraNoEsBorradorException,
    );
  });

  it('aprobar: draft → approved', async () => {
    const actualizada = await buildService().aprobar(CONTEXT, 'oc-1');
    expect(actualizada.status_id).toBe('st-approved');
  });

  it('aprobar: rechaza si ya no está en draft', async () => {
    orden = buildOrden({ status_id: 'st-approved' });
    (ordenCompraRepository.obtener as jest.Mock).mockResolvedValue(orden);
    await expect(buildService().aprobar(CONTEXT, 'oc-1')).rejects.toThrow(
      OrdenCompraTransicionInvalidaException,
    );
  });

  it('cancelar: permitido desde draft', async () => {
    const actualizada = await buildService().cancelar(CONTEXT, 'oc-1');
    expect(actualizada.status_id).toBe('st-cancelled');
  });

  it('cancelar: permitido desde approved', async () => {
    orden = buildOrden({ status_id: 'st-approved' });
    (ordenCompraRepository.obtener as jest.Mock).mockResolvedValue(orden);
    const actualizada = await buildService().cancelar(CONTEXT, 'oc-1');
    expect(actualizada.status_id).toBe('st-cancelled');
  });

  it('cancelar: rechaza desde un estado final', async () => {
    orden = buildOrden({ status_id: 'st-cancelled' });
    (ordenCompraRepository.obtener as jest.Mock).mockResolvedValue(orden);
    await expect(buildService().cancelar(CONTEXT, 'oc-1')).rejects.toThrow(
      OrdenCompraTransicionInvalidaException,
    );
  });

  it('historial: delega en el repositorio de historial tras verificar existencia', async () => {
    await buildService().historial(CONTEXT, 'oc-1');
    expect(historialEstadoOrdenRepository.listar).toHaveBeenCalledWith(CONTEXT, 'oc-1');
  });
});
