import type { UserContext } from '@gorazus/contracts';
import type { purchase_invoice_matching } from '@gorazus/core-database';
import { CotejoCompraRepository } from '../repositories/cotejo-compra.repository';
import {
  OrdenCompraRepository,
  type OrdenCompraConLineas,
} from '../repositories/orden-compra.repository';
import {
  RecepcionCompraRepository,
  type RecepcionCompraConLineas,
} from '../repositories/recepcion-compra.repository';
import {
  FacturaCompraRepository,
  type FacturaCompraConLineas,
} from '../repositories/factura-compra.repository';
import {
  CotejosCompraService,
  CotejoCompraNoEncontradoException,
  CotejoCompraInvalidoException,
} from './cotejos-compra.service';

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
    purchase_order_lines: [{ id: 'l-1', product_id: 'p-1', quantity: 10, unit_price: 20 }],
    ...overrides,
  } as unknown as OrdenCompraConLineas;
}

function buildRecepcion(
  overrides: Partial<RecepcionCompraConLineas> = {},
): RecepcionCompraConLineas {
  return {
    id: 'rec-1',
    purchase_order_id: 'oc-1',
    goods_receipt_note_lines: [{ id: 'gl-1', product_id: 'p-1', quantity: 10 }],
    ...overrides,
  } as unknown as RecepcionCompraConLineas;
}

function buildFactura(overrides: Partial<FacturaCompraConLineas> = {}): FacturaCompraConLineas {
  return {
    id: 'fc-1',
    purchase_order_id: 'oc-1',
    total_amount: 200,
    purchase_invoice_lines: [{ id: 'il-1', product_id: 'p-1', quantity: 10, unit_cost: 20 }],
    ...overrides,
  } as unknown as FacturaCompraConLineas;
}

describe('CotejosCompraService', () => {
  let cotejo: purchase_invoice_matching;
  let orden: OrdenCompraConLineas;
  let recepcion: RecepcionCompraConLineas;
  let factura: FacturaCompraConLineas;
  let cotejoCompraRepository: CotejoCompraRepository;
  let ordenCompraRepository: OrdenCompraRepository;
  let recepcionCompraRepository: RecepcionCompraRepository;
  let facturaCompraRepository: FacturaCompraRepository;

  beforeEach(() => {
    orden = buildOrden();
    recepcion = buildRecepcion();
    factura = buildFactura();
    cotejo = {
      id: 'c1',
      purchase_order_id: 'oc-1',
      receipt_note_id: 'rec-1',
      purchase_invoice_id: 'fc-1',
      discrepancy_amount: 0,
      is_within_tolerance: true,
    } as unknown as purchase_invoice_matching;

    cotejoCompraRepository = {
      crear: jest.fn(async () => cotejo),
      obtener: jest.fn(async () => cotejo),
      listar: jest.fn(async () => ({ data: [], meta: { page: 1, pageSize: 20, total: 0 } })),
      anular: jest.fn(async () => ({ ...cotejo, deleted_at: new Date() })),
    } as unknown as CotejoCompraRepository;

    ordenCompraRepository = {
      obtener: jest.fn(async () => orden),
    } as unknown as OrdenCompraRepository;

    recepcionCompraRepository = {
      obtener: jest.fn(async () => recepcion),
    } as unknown as RecepcionCompraRepository;

    facturaCompraRepository = {
      obtener: jest.fn(async () => factura),
    } as unknown as FacturaCompraRepository;
  });

  function buildService(): CotejosCompraService {
    return new CotejosCompraService(
      cotejoCompraRepository,
      ordenCompraRepository,
      recepcionCompraRepository,
      facturaCompraRepository,
    );
  }

  const inputBase = { purchaseOrderId: 'oc-1', receiptNoteId: 'rec-1', purchaseInvoiceId: 'fc-1' };

  it('ejecutar: rechaza si la orden no existe', async () => {
    (ordenCompraRepository.obtener as jest.Mock).mockResolvedValueOnce(null);
    await expect(buildService().ejecutar(CONTEXT, inputBase)).rejects.toThrow(
      CotejoCompraInvalidoException,
    );
  });

  it('ejecutar: rechaza si la recepción no existe', async () => {
    (recepcionCompraRepository.obtener as jest.Mock).mockResolvedValueOnce(null);
    await expect(buildService().ejecutar(CONTEXT, inputBase)).rejects.toThrow(
      'No existe la recepción',
    );
  });

  it('ejecutar: rechaza si la recepción no corresponde a la orden', async () => {
    recepcion = buildRecepcion({ purchase_order_id: 'oc-otra' });
    (recepcionCompraRepository.obtener as jest.Mock).mockResolvedValue(recepcion);
    await expect(buildService().ejecutar(CONTEXT, inputBase)).rejects.toThrow(
      'no corresponde a la orden de compra',
    );
  });

  it('ejecutar: rechaza si la factura no existe', async () => {
    (facturaCompraRepository.obtener as jest.Mock).mockResolvedValueOnce(null);
    await expect(buildService().ejecutar(CONTEXT, inputBase)).rejects.toThrow(
      'No existe la factura',
    );
  });

  it('ejecutar: rechaza si la factura está asociada a otra orden', async () => {
    factura = buildFactura({ purchase_order_id: 'oc-otra' });
    (facturaCompraRepository.obtener as jest.Mock).mockResolvedValue(factura);
    await expect(buildService().ejecutar(CONTEXT, inputBase)).rejects.toThrow(
      'asociada a otra orden de compra',
    );
  });

  it('ejecutar: sin discrepancia cuando ordenado=recibido=facturado', async () => {
    await buildService().ejecutar(CONTEXT, inputBase);
    expect(cotejoCompraRepository.crear).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ discrepancyAmount: 0, isWithinTolerance: true }),
    );
  });

  it('ejecutar: calcula discrepancia cuando lo facturado no coincide con lo recibido×precio ordenado', async () => {
    // Facturado: 10 × 25 = 250. Esperado: recibido(10) × precio orden(20) = 200. Discrepancia = 50.
    factura = buildFactura({
      purchase_invoice_lines: [
        { id: 'il-1', product_id: 'p-1', quantity: 10, unit_cost: 25 },
      ] as unknown as FacturaCompraConLineas['purchase_invoice_lines'],
    });
    (facturaCompraRepository.obtener as jest.Mock).mockResolvedValue(factura);
    await buildService().ejecutar(CONTEXT, inputBase);
    expect(cotejoCompraRepository.crear).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ discrepancyAmount: 50 }),
    );
  });

  it('ejecutar: producto facturado pero no recibido cuenta como discrepancia total de esa línea', async () => {
    recepcion = buildRecepcion({
      goods_receipt_note_lines:
        [] as unknown as RecepcionCompraConLineas['goods_receipt_note_lines'],
    });
    (recepcionCompraRepository.obtener as jest.Mock).mockResolvedValue(recepcion);
    await buildService().ejecutar(CONTEXT, inputBase);
    // Facturado 10×20=200, recibido 0 → esperado 0 → discrepancia 200.
    expect(cotejoCompraRepository.crear).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ discrepancyAmount: 200, isWithinTolerance: false }),
    );
  });

  it('obtener: cotejo inexistente lanza CotejoCompraNoEncontradoException', async () => {
    (cotejoCompraRepository.obtener as jest.Mock).mockResolvedValueOnce(null);
    await expect(buildService().obtener(CONTEXT, 'no-existe')).rejects.toThrow(
      CotejoCompraNoEncontradoException,
    );
  });

  it('anular: verifica existencia antes de anular', async () => {
    await buildService().anular(CONTEXT, 'c1');
    expect(cotejoCompraRepository.anular).toHaveBeenCalledWith(CONTEXT, 'c1');
  });
});
