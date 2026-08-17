import type { UserContext } from '@gorazus/contracts';
import type { purchase_order_status } from '@gorazus/core-database';
import {
  RecepcionCompraRepository,
  type RecepcionCompraConLineas,
} from '../repositories/recepcion-compra.repository';
import {
  OrdenCompraRepository,
  type OrdenCompraConLineas,
} from '../repositories/orden-compra.repository';
import { EstadoOrdenCompraRepository } from '../repositories/estado-orden-compra.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import {
  RecepcionesCompraService,
  RecepcionCompraNoEncontradaException,
  RecepcionCompraInvalidaException,
  OrdenNoValidaParaRecepcionException,
  CantidadExcedeOrdenException,
} from './recepciones-compra.service';
import type { CrearRecepcionCompraInput } from '../validators/recepciones-compra.schema';

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
    status_id: 'st-approved',
    purchase_order_lines: [{ id: 'l-1', product_id: 'p-1', quantity: 10, unit_price: 25 }],
    ...overrides,
  } as unknown as OrdenCompraConLineas;
}

function buildRecepcion(
  overrides: Partial<RecepcionCompraConLineas> = {},
): RecepcionCompraConLineas {
  return {
    id: 'rec-1',
    company_id: 'company-1',
    branch_id: 'branch-1',
    purchase_order_id: 'oc-1',
    goods_receipt_note_lines: [{ id: 'gl-1', product_id: 'p-1', quantity: 4 }],
    ...overrides,
  } as unknown as RecepcionCompraConLineas;
}

describe('RecepcionesCompraService', () => {
  let orden: OrdenCompraConLineas;
  let recepcion: RecepcionCompraConLineas;
  let estadosExistentes: purchase_order_status[];
  let productoValido: boolean;
  let cantidadYaRecibida: number;
  let recepcionCompraRepository: RecepcionCompraRepository;
  let ordenCompraRepository: OrdenCompraRepository;
  let estadoOrdenCompraRepository: EstadoOrdenCompraRepository;
  let productoLookupRepository: ProductoLookupRepository;

  beforeEach(() => {
    orden = buildOrden();
    recepcion = buildRecepcion();
    productoValido = true;
    cantidadYaRecibida = 0;
    estadosExistentes = [
      { id: 'st-draft', code: 'draft' } as purchase_order_status,
      { id: 'st-approved', code: 'approved' } as purchase_order_status,
      { id: 'st-cancelled', code: 'cancelled' } as purchase_order_status,
    ];

    recepcionCompraRepository = {
      crear: jest.fn(async () => recepcion),
      obtenerPorIdempotencyKey: jest.fn(async () => null),
      obtener: jest.fn(async () => recepcion),
      listar: jest.fn(async () => ({ data: [], meta: { page: 1, pageSize: 20, total: 0 } })),
      actualizar: jest.fn(async () => recepcion),
      anular: jest.fn(async () => ({ ...recepcion, deleted_at: new Date() })),
      sumarCantidadRecibida: jest.fn(async () => cantidadYaRecibida),
    } as unknown as RecepcionCompraRepository;

    ordenCompraRepository = {
      obtener: jest.fn(async () => orden),
    } as unknown as OrdenCompraRepository;

    estadoOrdenCompraRepository = {
      findById: jest.fn(
        async (_ctx: unknown, { id }: { id: string }) =>
          estadosExistentes.find((e) => e.id === id) ?? null,
      ),
    } as unknown as EstadoOrdenCompraRepository;

    productoLookupRepository = {
      existeProducto: jest.fn(async () => productoValido),
    } as unknown as ProductoLookupRepository;
  });

  function buildService(): RecepcionesCompraService {
    return new RecepcionesCompraService(
      recepcionCompraRepository,
      ordenCompraRepository,
      estadoOrdenCompraRepository,
      productoLookupRepository,
    );
  }

  const inputBase: CrearRecepcionCompraInput = {
    purchaseOrderId: 'oc-1',
    lines: [{ productId: 'p-1', quantity: 4 }],
  };

  it('crear: rechaza si la orden no existe', async () => {
    (ordenCompraRepository.obtener as jest.Mock).mockResolvedValueOnce(null);
    await expect(buildService().crear(CONTEXT, inputBase)).rejects.toThrow(
      RecepcionCompraInvalidaException,
    );
  });

  it('crear: rechaza si la orden no está approved', async () => {
    orden = buildOrden({ status_id: 'st-draft' });
    (ordenCompraRepository.obtener as jest.Mock).mockResolvedValue(orden);
    await expect(buildService().crear(CONTEXT, inputBase)).rejects.toThrow(
      OrdenNoValidaParaRecepcionException,
    );
  });

  it('crear: rechaza si el producto no está incluido en la orden', async () => {
    await expect(
      buildService().crear(CONTEXT, {
        purchaseOrderId: 'oc-1',
        lines: [{ productId: 'p-x', quantity: 1 }],
      }),
    ).rejects.toThrow('no está incluido en la orden');
  });

  it('crear: rechaza si excede la cantidad ordenada', async () => {
    cantidadYaRecibida = 8;
    await expect(
      buildService().crear(CONTEXT, {
        purchaseOrderId: 'oc-1',
        lines: [{ productId: 'p-1', quantity: 5 }],
      }),
    ).rejects.toThrow(CantidadExcedeOrdenException);
  });

  it('crear: acepta recibir exactamente lo que resta (8 ya recibidos, orden 10, se reciben 2)', async () => {
    cantidadYaRecibida = 8;
    const creada = await buildService().crear(CONTEXT, {
      purchaseOrderId: 'oc-1',
      lines: [{ productId: 'p-1', quantity: 2 }],
    });
    expect(creada.id).toBe('rec-1');
  });

  it('crear: rechaza una recepción sin líneas (invariante de entidad)', async () => {
    await expect(
      buildService().crear(CONTEXT, { purchaseOrderId: 'oc-1', lines: [] }),
    ).rejects.toThrow('al menos una línea');
  });

  it('obtener: recepción inexistente lanza RecepcionCompraNoEncontradaException', async () => {
    (recepcionCompraRepository.obtener as jest.Mock).mockResolvedValueOnce(null);
    await expect(buildService().obtener(CONTEXT, 'no-existe')).rejects.toThrow(
      RecepcionCompraNoEncontradaException,
    );
  });

  it('actualizar: excluye la propia recepción al sumar cantidad ya recibida', async () => {
    await buildService().actualizar(CONTEXT, 'rec-1', {
      lines: [{ productId: 'p-1', quantity: 9 }],
    });
    expect(recepcionCompraRepository.sumarCantidadRecibida).toHaveBeenCalledWith(
      CONTEXT,
      'oc-1',
      'p-1',
      'rec-1',
    );
  });

  it('anular: verifica existencia antes de anular', async () => {
    await buildService().anular(CONTEXT, 'rec-1');
    expect(recepcionCompraRepository.anular).toHaveBeenCalledWith(CONTEXT, 'rec-1');
  });

  describe('ISSUE-07: idempotencyKey', () => {
    it('crear: sin idempotencyKey, nunca consulta obtenerPorIdempotencyKey', async () => {
      await buildService().crear(CONTEXT, inputBase);
      expect(recepcionCompraRepository.obtenerPorIdempotencyKey).not.toHaveBeenCalled();
      expect(recepcionCompraRepository.crear).toHaveBeenCalledWith(
        CONTEXT,
        expect.objectContaining({ idempotencyKey: null }),
      );
    });

    it('crear: clave nueva (sin registro previo) — sigue el flujo normal y la propaga al repositorio', async () => {
      await buildService().crear(CONTEXT, { ...inputBase, idempotencyKey: 'abc' });
      expect(recepcionCompraRepository.obtenerPorIdempotencyKey).toHaveBeenCalledWith(
        CONTEXT,
        'abc',
      );
      expect(ordenCompraRepository.obtener).toHaveBeenCalled(); // sí corrió validarOrdenYLineas
      expect(recepcionCompraRepository.crear).toHaveBeenCalledWith(
        CONTEXT,
        expect.objectContaining({ idempotencyKey: 'abc' }),
      );
    });

    it('crear: clave con registro previo — devuelve el original, NUNCA valida ni crea de nuevo', async () => {
      (recepcionCompraRepository.obtenerPorIdempotencyKey as jest.Mock).mockResolvedValueOnce(
        recepcion,
      );

      const resultado = await buildService().crear(CONTEXT, {
        ...inputBase,
        idempotencyKey: 'abc',
      });

      expect(resultado).toBe(recepcion);
      expect(ordenCompraRepository.obtener).not.toHaveBeenCalled(); // validarOrdenYLineas NUNCA corrió
      expect(recepcionCompraRepository.crear).not.toHaveBeenCalled();
    });

    it('crear: dos claves distintas producen dos llamadas independientes al repositorio', async () => {
      await buildService().crear(CONTEXT, { ...inputBase, idempotencyKey: 'key-1' });
      await buildService().crear(CONTEXT, { ...inputBase, idempotencyKey: 'key-2' });

      expect(recepcionCompraRepository.crear).toHaveBeenCalledTimes(2);
      expect(recepcionCompraRepository.crear).toHaveBeenNthCalledWith(
        1,
        CONTEXT,
        expect.objectContaining({ idempotencyKey: 'key-1' }),
      );
      expect(recepcionCompraRepository.crear).toHaveBeenNthCalledWith(
        2,
        CONTEXT,
        expect.objectContaining({ idempotencyKey: 'key-2' }),
      );
    });
  });
});
