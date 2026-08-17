import type { UserContext } from '@gorazus/contracts';
import type { import_status, purchase_order_status } from '@gorazus/core-database';
import {
  ExpedienteImportacionRepository,
  type ExpedienteImportacionConGastos,
} from '../repositories/expediente-importacion.repository';
import { EstadoImportacionRepository } from '../repositories/estado-importacion.repository';
import { HistorialEstadoImportacionRepository } from '../repositories/historial-estado-importacion.repository';
import { GastoImportacionRepository } from '../repositories/gasto-importacion.repository';
import {
  OrdenCompraRepository,
  type OrdenCompraConLineas,
} from '../repositories/orden-compra.repository';
import { EstadoOrdenCompraRepository } from '../repositories/estado-orden-compra.repository';
import {
  ImportacionesService,
  ExpedienteImportacionNoEncontradoException,
  ExpedienteImportacionInvalidoException,
  OrdenNoValidaParaImportacionException,
  ImportacionTransicionInvalidaException,
  GastoImportacionNoEncontradoException,
} from './importaciones.service';

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
    status_id: 'st-oc-approved',
    ...overrides,
  } as unknown as OrdenCompraConLineas;
}

function buildExpediente(
  overrides: Partial<ExpedienteImportacionConGastos> = {},
): ExpedienteImportacionConGastos {
  return {
    id: 'imp-1',
    company_id: 'company-1',
    branch_id: 'branch-1',
    purchase_order_id: 'oc-1',
    status_id: 'st-in_transit',
    import_expenses: [],
    ...overrides,
  } as unknown as ExpedienteImportacionConGastos;
}

describe('ImportacionesService', () => {
  let orden: OrdenCompraConLineas;
  let expediente: ExpedienteImportacionConGastos;
  let estadosImportacion: import_status[];
  let estadosOrden: purchase_order_status[];
  let expedienteImportacionRepository: ExpedienteImportacionRepository;
  let estadoImportacionRepository: EstadoImportacionRepository;
  let historialEstadoImportacionRepository: HistorialEstadoImportacionRepository;
  let gastoImportacionRepository: GastoImportacionRepository;
  let ordenCompraRepository: OrdenCompraRepository;
  let estadoOrdenCompraRepository: EstadoOrdenCompraRepository;

  beforeEach(() => {
    orden = buildOrden();
    expediente = buildExpediente();
    estadosOrden = [{ id: 'st-oc-approved', code: 'approved' } as purchase_order_status];
    estadosImportacion = [
      { id: 'st-in_transit', code: 'in_transit' } as import_status,
      { id: 'st-at_customs', code: 'at_customs' } as import_status,
      { id: 'st-cleared', code: 'cleared' } as import_status,
      { id: 'st-cancelled', code: 'cancelled' } as import_status,
    ];

    expedienteImportacionRepository = {
      crear: jest.fn(async () => expediente),
      obtener: jest.fn(async () => expediente),
      listar: jest.fn(async () => ({ data: [], meta: { page: 1, pageSize: 20, total: 0 } })),
      actualizarEstado: jest.fn(async (_ctx: unknown, _id: string, statusId: string) => {
        expediente = { ...expediente, status_id: statusId };
        return expediente;
      }),
      anular: jest.fn(async () => ({ ...expediente, deleted_at: new Date() })),
    } as unknown as ExpedienteImportacionRepository;

    estadoImportacionRepository = {
      findById: jest.fn(
        async (_ctx: unknown, { id }: { id: string }) =>
          estadosImportacion.find((e) => e.id === id) ?? null,
      ),
      findMany: jest.fn(async (_ctx: unknown, filter: { code?: string }) => {
        const data = estadosImportacion.filter((e) => !filter.code || e.code === filter.code);
        return { data, meta: { page: 1, pageSize: 1, total: data.length } };
      }),
      create: jest.fn(async (_ctx: unknown, data: { code: string }) => {
        const nuevo = { id: `st-${data.code}`, code: data.code } as import_status;
        estadosImportacion.push(nuevo);
        return nuevo;
      }),
    } as unknown as EstadoImportacionRepository;

    historialEstadoImportacionRepository = {
      registrar: jest.fn(async (_ctx: unknown, params: unknown) => params),
      listar: jest.fn(async () => []),
    } as unknown as HistorialEstadoImportacionRepository;

    gastoImportacionRepository = {
      crear: jest.fn(async () => ({
        id: 'g1',
        import_id: 'imp-1',
        expense_type: 'freight',
        amount: 50,
      })),
      obtener: jest.fn(async () => ({
        id: 'g1',
        import_id: 'imp-1',
        expense_type: 'freight',
        amount: 50,
      })),
      anular: jest.fn(async () => ({ id: 'g1', import_id: 'imp-1', deleted_at: new Date() })),
    } as unknown as GastoImportacionRepository;

    ordenCompraRepository = {
      obtener: jest.fn(async () => orden),
    } as unknown as OrdenCompraRepository;

    estadoOrdenCompraRepository = {
      findById: jest.fn(
        async (_ctx: unknown, { id }: { id: string }) =>
          estadosOrden.find((e) => e.id === id) ?? null,
      ),
    } as unknown as EstadoOrdenCompraRepository;
  });

  function buildService(): ImportacionesService {
    return new ImportacionesService(
      expedienteImportacionRepository,
      estadoImportacionRepository,
      historialEstadoImportacionRepository,
      gastoImportacionRepository,
      ordenCompraRepository,
      estadoOrdenCompraRepository,
    );
  }

  it('crear: rechaza si la orden no existe', async () => {
    (ordenCompraRepository.obtener as jest.Mock).mockResolvedValueOnce(null);
    await expect(buildService().crear(CONTEXT, { purchaseOrderId: 'oc-1' })).rejects.toThrow(
      ExpedienteImportacionInvalidoException,
    );
  });

  it('crear: rechaza si la orden no está approved', async () => {
    orden = buildOrden({ status_id: 'st-oc-draft' });
    (ordenCompraRepository.obtener as jest.Mock).mockResolvedValue(orden);
    await expect(buildService().crear(CONTEXT, { purchaseOrderId: 'oc-1' })).rejects.toThrow(
      OrdenNoValidaParaImportacionException,
    );
  });

  it('crear: caso feliz — registra historial de la transición inicial', async () => {
    const creado = await buildService().crear(CONTEXT, { purchaseOrderId: 'oc-1' });
    expect(creado.id).toBe('imp-1');
    expect(historialEstadoImportacionRepository.registrar).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ importId: 'imp-1', statusId: 'st-in_transit' }),
    );
  });

  it('obtener: expediente inexistente lanza ExpedienteImportacionNoEncontradoException', async () => {
    (expedienteImportacionRepository.obtener as jest.Mock).mockResolvedValueOnce(null);
    await expect(buildService().obtener(CONTEXT, 'no-existe')).rejects.toThrow(
      ExpedienteImportacionNoEncontradoException,
    );
  });

  it('avanzarAAduana: in_transit → at_customs', async () => {
    const actualizado = await buildService().avanzarAAduana(CONTEXT, 'imp-1');
    expect(actualizado.status_id).toBe('st-at_customs');
  });

  it('avanzarAAduana: rechaza si ya no está in_transit', async () => {
    expediente = buildExpediente({ status_id: 'st-at_customs' });
    (expedienteImportacionRepository.obtener as jest.Mock).mockResolvedValue(expediente);
    await expect(buildService().avanzarAAduana(CONTEXT, 'imp-1')).rejects.toThrow(
      ImportacionTransicionInvalidaException,
    );
  });

  it('nacionalizar: rechaza si no está at_customs', async () => {
    await expect(buildService().nacionalizar(CONTEXT, 'imp-1')).rejects.toThrow(
      ImportacionTransicionInvalidaException,
    );
  });

  it('nacionalizar: at_customs → cleared', async () => {
    expediente = buildExpediente({ status_id: 'st-at_customs' });
    (expedienteImportacionRepository.obtener as jest.Mock).mockResolvedValue(expediente);
    const actualizado = await buildService().nacionalizar(CONTEXT, 'imp-1');
    expect(actualizado.status_id).toBe('st-cleared');
  });

  it('cancelar: permitido desde in_transit y at_customs, no desde cleared', async () => {
    const cancelado1 = await buildService().cancelar(CONTEXT, 'imp-1');
    expect(cancelado1.status_id).toBe('st-cancelled');

    expediente = buildExpediente({ status_id: 'st-cleared' });
    (expedienteImportacionRepository.obtener as jest.Mock).mockResolvedValue(expediente);
    await expect(buildService().cancelar(CONTEXT, 'imp-1')).rejects.toThrow(
      ImportacionTransicionInvalidaException,
    );
  });

  it('agregarGasto: rechaza si el expediente está cancelado', async () => {
    expediente = buildExpediente({ status_id: 'st-cancelled' });
    (expedienteImportacionRepository.obtener as jest.Mock).mockResolvedValue(expediente);
    await expect(
      buildService().agregarGasto(CONTEXT, 'imp-1', { expenseType: 'freight', amount: 50 }),
    ).rejects.toThrow(ImportacionTransicionInvalidaException);
  });

  it('agregarGasto: caso feliz', async () => {
    const gasto = await buildService().agregarGasto(CONTEXT, 'imp-1', {
      expenseType: 'freight',
      amount: 50,
    });
    expect(gasto.id).toBe('g1');
  });

  it('anularGasto: rechaza si el gasto no pertenece al expediente indicado', async () => {
    (gastoImportacionRepository.obtener as jest.Mock).mockResolvedValueOnce({
      id: 'g1',
      import_id: 'imp-otro',
    });
    await expect(buildService().anularGasto(CONTEXT, 'imp-1', 'g1')).rejects.toThrow(
      GastoImportacionNoEncontradoException,
    );
  });

  it('anular: rechaza si ya está cleared', async () => {
    expediente = buildExpediente({ status_id: 'st-cleared' });
    (expedienteImportacionRepository.obtener as jest.Mock).mockResolvedValue(expediente);
    await expect(buildService().anular(CONTEXT, 'imp-1')).rejects.toThrow(
      ImportacionTransicionInvalidaException,
    );
  });

  it('historial: delega en el repositorio de historial tras verificar existencia', async () => {
    await buildService().historial(CONTEXT, 'imp-1');
    expect(historialEstadoImportacionRepository.listar).toHaveBeenCalledWith(CONTEXT, 'imp-1');
  });
});
