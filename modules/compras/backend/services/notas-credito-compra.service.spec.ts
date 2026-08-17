import type { UserContext } from '@gorazus/contracts';
import type { purchase_invoice_status } from '@gorazus/core-database';
import {
  NotaCreditoCompraRepository,
  type NotaCreditoCompraConLineas,
} from '../repositories/nota-credito-compra.repository';
import {
  FacturaCompraRepository,
  type FacturaCompraConLineas,
} from '../repositories/factura-compra.repository';
import { EstadoFacturaCompraRepository } from '../repositories/estado-factura-compra.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import {
  NotasCreditoCompraService,
  NotaCreditoCompraNoEncontradaException,
  NotaCreditoCompraInvalidaException,
  FacturaNoValidaParaNotaCreditoException,
  CantidadExcedeFacturaException,
} from './notas-credito-compra.service';

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

function buildNota(
  overrides: Partial<NotaCreditoCompraConLineas> = {},
): NotaCreditoCompraConLineas {
  return {
    id: 'nc-1',
    company_id: 'company-1',
    branch_id: 'branch-1',
    purchase_invoice_id: 'fc-1',
    total_amount: 80,
    purchase_credit_note_lines: [{ id: 'nl-1', product_id: 'p-1', quantity: 4 }],
    ...overrides,
  } as unknown as NotaCreditoCompraConLineas;
}

describe('NotasCreditoCompraService', () => {
  let factura: FacturaCompraConLineas;
  let nota: NotaCreditoCompraConLineas;
  let estadosExistentes: purchase_invoice_status[];
  let productoValido: boolean;
  let cantidadYaAcreditada: number;
  let notaCreditoCompraRepository: NotaCreditoCompraRepository;
  let facturaCompraRepository: FacturaCompraRepository;
  let estadoFacturaCompraRepository: EstadoFacturaCompraRepository;
  let productoLookupRepository: ProductoLookupRepository;

  beforeEach(() => {
    factura = buildFactura();
    nota = buildNota();
    productoValido = true;
    cantidadYaAcreditada = 0;
    estadosExistentes = [
      { id: 'st-approved', code: 'approved' } as purchase_invoice_status,
      { id: 'st-cancelled', code: 'cancelled' } as purchase_invoice_status,
    ];

    notaCreditoCompraRepository = {
      crear: jest.fn(async () => nota),
      obtener: jest.fn(async () => nota),
      listar: jest.fn(async () => ({ data: [], meta: { page: 1, pageSize: 20, total: 0 } })),
      actualizar: jest.fn(async () => nota),
      anular: jest.fn(async () => ({ ...nota, deleted_at: new Date() })),
      sumarCantidadAcreditada: jest.fn(async () => cantidadYaAcreditada),
    } as unknown as NotaCreditoCompraRepository;

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

  function buildService(): NotasCreditoCompraService {
    return new NotasCreditoCompraService(
      notaCreditoCompraRepository,
      facturaCompraRepository,
      estadoFacturaCompraRepository,
      productoLookupRepository,
    );
  }

  const inputBase = { purchaseInvoiceId: 'fc-1', lines: [{ productId: 'p-1', quantity: 4 }] };

  it('crear: rechaza si la factura no existe', async () => {
    (facturaCompraRepository.obtener as jest.Mock).mockResolvedValueOnce(null);
    await expect(buildService().crear(CONTEXT, inputBase)).rejects.toThrow(
      NotaCreditoCompraInvalidaException,
    );
  });

  it('crear: rechaza si la factura está cancelada', async () => {
    factura = buildFactura({ status_id: 'st-cancelled' });
    (facturaCompraRepository.obtener as jest.Mock).mockResolvedValue(factura);
    await expect(buildService().crear(CONTEXT, inputBase)).rejects.toThrow(
      FacturaNoValidaParaNotaCreditoException,
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
    cantidadYaAcreditada = 8;
    await expect(
      buildService().crear(CONTEXT, {
        purchaseInvoiceId: 'fc-1',
        lines: [{ productId: 'p-1', quantity: 5 }],
      }),
    ).rejects.toThrow(CantidadExcedeFacturaException);
  });

  it('crear: calcula el monto total a partir del costo unitario de la factura (4 × 20 = 80)', async () => {
    const creada = await buildService().crear(CONTEXT, inputBase);
    expect(creada.id).toBe('nc-1');
    expect(notaCreditoCompraRepository.crear).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ totalAmount: 80 }),
    );
  });

  it('crear: rechaza una nota sin líneas (invariante de entidad)', async () => {
    await expect(
      buildService().crear(CONTEXT, { purchaseInvoiceId: 'fc-1', lines: [] }),
    ).rejects.toThrow('al menos una línea');
  });

  it('obtener: nota inexistente lanza NotaCreditoCompraNoEncontradaException', async () => {
    (notaCreditoCompraRepository.obtener as jest.Mock).mockResolvedValueOnce(null);
    await expect(buildService().obtener(CONTEXT, 'no-existe')).rejects.toThrow(
      NotaCreditoCompraNoEncontradaException,
    );
  });

  it('actualizar: excluye la propia nota al sumar cantidad ya acreditada', async () => {
    await buildService().actualizar(CONTEXT, 'nc-1', {
      lines: [{ productId: 'p-1', quantity: 9 }],
    });
    expect(notaCreditoCompraRepository.sumarCantidadAcreditada).toHaveBeenCalledWith(
      CONTEXT,
      'fc-1',
      'p-1',
      'nc-1',
    );
  });

  it('anular: verifica existencia antes de anular', async () => {
    await buildService().anular(CONTEXT, 'nc-1');
    expect(notaCreditoCompraRepository.anular).toHaveBeenCalledWith(CONTEXT, 'nc-1');
  });
});
