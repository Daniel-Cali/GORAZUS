import type { UserContext } from '@gorazus/contracts';
import type { purchase_requisition_status } from '@gorazus/core-database';
import {
  SolicitudCompraRepository,
  type SolicitudCompraConLineas,
} from '../repositories/solicitud-compra.repository';
import { EstadoSolicitudCompraRepository } from '../repositories/estado-solicitud-compra.repository';
import { HistorialEstadoSolicitudRepository } from '../repositories/historial-estado-solicitud.repository';
import { EmpresaSucursalLookupRepository } from '../repositories/empresa-sucursal-lookup.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import {
  SolicitudesCompraService,
  SolicitudCompraNoEncontradaException,
  SolicitudCompraInvalidaException,
  SolicitudCompraNoEsBorradorException,
  SolicitudCompraTransicionInvalidaException,
} from './solicitudes-compra.service';
import type { CrearSolicitudCompraInput } from '../validators/solicitudes-compra.schema';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

function buildSolicitud(
  overrides: Partial<SolicitudCompraConLineas> = {},
): SolicitudCompraConLineas {
  return {
    id: 'req-1',
    company_id: 'company-1',
    branch_id: 'branch-1',
    requested_by_user_id: 'user-1',
    status_id: 'st-draft',
    document_number: 'REQ-1',
    purchase_requisition_lines: [{ id: 'l-1', product_id: 'p-1', quantity: 10 }],
    ...overrides,
  } as unknown as SolicitudCompraConLineas;
}

describe('SolicitudesCompraService', () => {
  let solicitud: SolicitudCompraConLineas;
  let estadosExistentes: purchase_requisition_status[];
  let empresaValida: boolean;
  let sucursalValida: boolean;
  let productoValido: boolean;
  let solicitudCompraRepository: SolicitudCompraRepository;
  let estadoSolicitudCompraRepository: EstadoSolicitudCompraRepository;
  let historialEstadoSolicitudRepository: HistorialEstadoSolicitudRepository;
  let empresaSucursalLookupRepository: EmpresaSucursalLookupRepository;
  let productoLookupRepository: ProductoLookupRepository;

  beforeEach(() => {
    solicitud = buildSolicitud();
    empresaValida = true;
    sucursalValida = true;
    productoValido = true;
    estadosExistentes = [
      { id: 'st-draft', code: 'draft' } as purchase_requisition_status,
      { id: 'st-submitted', code: 'submitted' } as purchase_requisition_status,
      { id: 'st-approved', code: 'approved' } as purchase_requisition_status,
      { id: 'st-rejected', code: 'rejected' } as purchase_requisition_status,
      { id: 'st-cancelled', code: 'cancelled' } as purchase_requisition_status,
    ];

    solicitudCompraRepository = {
      crear: jest.fn(async () => solicitud),
      obtener: jest.fn(async () => solicitud),
      listar: jest.fn(async () => ({ data: [], meta: { page: 1, pageSize: 20, total: 0 } })),
      actualizarEstado: jest.fn(async (_ctx: unknown, _id: string, statusId: string) => {
        solicitud = { ...solicitud, status_id: statusId };
        return solicitud;
      }),
      actualizar: jest.fn(async () => solicitud),
      eliminar: jest.fn(async () => ({ ...solicitud, deleted_at: new Date() })),
    } as unknown as SolicitudCompraRepository;

    estadoSolicitudCompraRepository = {
      findById: jest.fn(
        async (_ctx: unknown, { id }: { id: string }) =>
          estadosExistentes.find((e) => e.id === id) ?? null,
      ),
      findMany: jest.fn(async (_ctx: unknown, filter: { code?: string }) => {
        const data = estadosExistentes.filter((e) => !filter.code || e.code === filter.code);
        return { data, meta: { page: 1, pageSize: 1, total: data.length } };
      }),
      create: jest.fn(async (_ctx: unknown, data: { code: string }) => {
        const nuevo = { id: `st-${data.code}`, code: data.code } as purchase_requisition_status;
        estadosExistentes.push(nuevo);
        return nuevo;
      }),
    } as unknown as EstadoSolicitudCompraRepository;

    historialEstadoSolicitudRepository = {
      registrar: jest.fn(async (_ctx: unknown, params: unknown) => params),
      listar: jest.fn(async () => []),
    } as unknown as HistorialEstadoSolicitudRepository;

    empresaSucursalLookupRepository = {
      existeEmpresa: jest.fn(async () => empresaValida),
      existeSucursalDeEmpresa: jest.fn(async () => sucursalValida),
    } as unknown as EmpresaSucursalLookupRepository;

    productoLookupRepository = {
      existeProducto: jest.fn(async () => productoValido),
    } as unknown as ProductoLookupRepository;
  });

  function buildService(): SolicitudesCompraService {
    return new SolicitudesCompraService(
      solicitudCompraRepository,
      estadoSolicitudCompraRepository,
      historialEstadoSolicitudRepository,
      empresaSucursalLookupRepository,
      productoLookupRepository,
    );
  }

  const inputBase: CrearSolicitudCompraInput = {
    companyId: 'company-1',
    branchId: 'branch-1',
    lines: [{ productId: 'p-1', quantity: 10 }],
  };

  it('crear: rechaza si la empresa no existe', async () => {
    empresaValida = false;
    await expect(buildService().crear(CONTEXT, inputBase)).rejects.toThrow(
      SolicitudCompraInvalidaException,
    );
  });

  it('crear: rechaza si la sucursal no pertenece a la empresa', async () => {
    sucursalValida = false;
    await expect(buildService().crear(CONTEXT, inputBase)).rejects.toThrow('No existe la sucursal');
  });

  it('crear: rechaza si un producto de línea no existe', async () => {
    productoValido = false;
    await expect(buildService().crear(CONTEXT, inputBase)).rejects.toThrow('No existe el producto');
  });

  it('crear: rechaza una solicitud sin líneas (invariante de entidad)', async () => {
    await expect(buildService().crear(CONTEXT, { ...inputBase, lines: [] })).rejects.toThrow(
      'al menos una línea',
    );
  });

  it('crear: caso feliz — registra historial de la transición inicial', async () => {
    const creada = await buildService().crear(CONTEXT, inputBase);
    expect(creada.id).toBe('req-1');
    expect(historialEstadoSolicitudRepository.registrar).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ requisitionId: 'req-1', statusId: 'st-draft' }),
    );
  });

  it('obtener: solicitud inexistente lanza SolicitudCompraNoEncontradaException', async () => {
    (solicitudCompraRepository.obtener as jest.Mock).mockResolvedValueOnce(null);
    await expect(buildService().obtener(CONTEXT, 'no-existe')).rejects.toThrow(
      SolicitudCompraNoEncontradaException,
    );
  });

  it('actualizar: rechaza si ya no está en borrador', async () => {
    solicitud = buildSolicitud({ status_id: 'st-submitted' });
    (solicitudCompraRepository.obtener as jest.Mock).mockResolvedValue(solicitud);
    await expect(
      buildService().actualizar(CONTEXT, 'req-1', { lines: inputBase.lines }),
    ).rejects.toThrow(SolicitudCompraNoEsBorradorException);
  });

  it('eliminar: rechaza si ya no está en borrador', async () => {
    solicitud = buildSolicitud({ status_id: 'st-approved' });
    (solicitudCompraRepository.obtener as jest.Mock).mockResolvedValue(solicitud);
    await expect(buildService().eliminar(CONTEXT, 'req-1')).rejects.toThrow(
      SolicitudCompraNoEsBorradorException,
    );
  });

  it('enviar: draft → submitted', async () => {
    const actualizada = await buildService().enviar(CONTEXT, 'req-1');
    expect(actualizada.status_id).toBe('st-submitted');
  });

  it('enviar: rechaza si ya no está en draft', async () => {
    solicitud = buildSolicitud({ status_id: 'st-submitted' });
    (solicitudCompraRepository.obtener as jest.Mock).mockResolvedValue(solicitud);
    await expect(buildService().enviar(CONTEXT, 'req-1')).rejects.toThrow(
      SolicitudCompraTransicionInvalidaException,
    );
  });

  it('aprobar: rechaza si no está submitted', async () => {
    await expect(buildService().aprobar(CONTEXT, 'req-1')).rejects.toThrow(
      SolicitudCompraTransicionInvalidaException,
    );
  });

  it('aprobar: submitted → approved', async () => {
    solicitud = buildSolicitud({ status_id: 'st-submitted' });
    (solicitudCompraRepository.obtener as jest.Mock).mockResolvedValue(solicitud);
    const actualizada = await buildService().aprobar(CONTEXT, 'req-1');
    expect(actualizada.status_id).toBe('st-approved');
  });

  it('rechazar: submitted → rejected', async () => {
    solicitud = buildSolicitud({ status_id: 'st-submitted' });
    (solicitudCompraRepository.obtener as jest.Mock).mockResolvedValue(solicitud);
    const actualizada = await buildService().rechazar(CONTEXT, 'req-1');
    expect(actualizada.status_id).toBe('st-rejected');
  });

  it('cancelar: permitido desde draft', async () => {
    const actualizada = await buildService().cancelar(CONTEXT, 'req-1');
    expect(actualizada.status_id).toBe('st-cancelled');
  });

  it('cancelar: permitido desde submitted', async () => {
    solicitud = buildSolicitud({ status_id: 'st-submitted' });
    (solicitudCompraRepository.obtener as jest.Mock).mockResolvedValue(solicitud);
    const actualizada = await buildService().cancelar(CONTEXT, 'req-1');
    expect(actualizada.status_id).toBe('st-cancelled');
  });

  it('cancelar: rechaza desde un estado final', async () => {
    solicitud = buildSolicitud({ status_id: 'st-approved' });
    (solicitudCompraRepository.obtener as jest.Mock).mockResolvedValue(solicitud);
    await expect(buildService().cancelar(CONTEXT, 'req-1')).rejects.toThrow(
      SolicitudCompraTransicionInvalidaException,
    );
  });

  it('historial: delega en el repositorio de historial tras verificar existencia', async () => {
    await buildService().historial(CONTEXT, 'req-1');
    expect(historialEstadoSolicitudRepository.listar).toHaveBeenCalledWith(CONTEXT, 'req-1');
  });
});
