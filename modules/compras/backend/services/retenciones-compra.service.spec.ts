import type { UserContext } from '@gorazus/contracts';
import type { purchase_withholdings, purchase_invoice_status } from '@gorazus/core-database';
import { RetencionCompraRepository } from '../repositories/retencion-compra.repository';
import {
  FacturaCompraRepository,
  type FacturaCompraConLineas,
} from '../repositories/factura-compra.repository';
import { EstadoFacturaCompraRepository } from '../repositories/estado-factura-compra.repository';
import {
  RetencionesCompraService,
  RetencionCompraNoEncontradaException,
  RetencionCompraInvalidaException,
  FacturaNoValidaParaRetencionException,
  MontoExcedeFacturaException,
} from './retenciones-compra.service';

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
    total_amount: 100,
    ...overrides,
  } as unknown as FacturaCompraConLineas;
}

describe('RetencionesCompraService', () => {
  let retencion: purchase_withholdings;
  let factura: FacturaCompraConLineas;
  let estadosExistentes: purchase_invoice_status[];
  let montoYaRetenido: number;
  let retencionCompraRepository: RetencionCompraRepository;
  let facturaCompraRepository: FacturaCompraRepository;
  let estadoFacturaCompraRepository: EstadoFacturaCompraRepository;

  beforeEach(() => {
    factura = buildFactura();
    montoYaRetenido = 0;
    retencion = {
      id: 'r1',
      purchase_invoice_id: 'fc-1',
      withholding_rule_id: null,
      amount: 10,
    } as unknown as purchase_withholdings;
    estadosExistentes = [
      { id: 'st-approved', code: 'approved' } as purchase_invoice_status,
      { id: 'st-cancelled', code: 'cancelled' } as purchase_invoice_status,
    ];

    retencionCompraRepository = {
      crear: jest.fn(async () => retencion),
      obtener: jest.fn(async () => retencion),
      listar: jest.fn(async () => ({ data: [], meta: { page: 1, pageSize: 20, total: 0 } })),
      actualizar: jest.fn(async () => retencion),
      anular: jest.fn(async () => ({ ...retencion, deleted_at: new Date() })),
      sumarMontoRetenido: jest.fn(async () => montoYaRetenido),
    } as unknown as RetencionCompraRepository;

    facturaCompraRepository = {
      obtener: jest.fn(async () => factura),
    } as unknown as FacturaCompraRepository;

    estadoFacturaCompraRepository = {
      findById: jest.fn(
        async (_ctx: unknown, { id }: { id: string }) =>
          estadosExistentes.find((e) => e.id === id) ?? null,
      ),
    } as unknown as EstadoFacturaCompraRepository;
  });

  function buildService(): RetencionesCompraService {
    return new RetencionesCompraService(
      retencionCompraRepository,
      facturaCompraRepository,
      estadoFacturaCompraRepository,
    );
  }

  const inputBase = { purchaseInvoiceId: 'fc-1', amount: 10 };

  it('crear: rechaza si la factura no existe', async () => {
    (facturaCompraRepository.obtener as jest.Mock).mockResolvedValueOnce(null);
    await expect(buildService().crear(CONTEXT, inputBase)).rejects.toThrow(
      RetencionCompraInvalidaException,
    );
  });

  it('crear: rechaza si la factura está cancelada', async () => {
    factura = buildFactura({ status_id: 'st-cancelled' });
    (facturaCompraRepository.obtener as jest.Mock).mockResolvedValue(factura);
    await expect(buildService().crear(CONTEXT, inputBase)).rejects.toThrow(
      FacturaNoValidaParaRetencionException,
    );
  });

  it('crear: rechaza si el monto excede el total de la factura', async () => {
    montoYaRetenido = 95;
    await expect(
      buildService().crear(CONTEXT, { purchaseInvoiceId: 'fc-1', amount: 10 }),
    ).rejects.toThrow(MontoExcedeFacturaException);
  });

  it('crear: acepta retener exactamente lo que resta (95 ya retenido, total 100, se retienen 5)', async () => {
    montoYaRetenido = 95;
    const creada = await buildService().crear(CONTEXT, { purchaseInvoiceId: 'fc-1', amount: 5 });
    expect(creada.id).toBe('r1');
  });

  it('crear: rechaza monto cero o negativo (invariante de entidad)', async () => {
    await expect(
      buildService().crear(CONTEXT, { purchaseInvoiceId: 'fc-1', amount: 0 }),
    ).rejects.toThrow('mayor que cero');
  });

  it('obtener: retención inexistente lanza RetencionCompraNoEncontradaException', async () => {
    (retencionCompraRepository.obtener as jest.Mock).mockResolvedValueOnce(null);
    await expect(buildService().obtener(CONTEXT, 'no-existe')).rejects.toThrow(
      RetencionCompraNoEncontradaException,
    );
  });

  it('actualizar: excluye la propia retención al sumar monto ya retenido', async () => {
    await buildService().actualizar(CONTEXT, 'r1', { amount: 20 });
    expect(retencionCompraRepository.sumarMontoRetenido).toHaveBeenCalledWith(
      CONTEXT,
      'fc-1',
      'r1',
    );
  });

  it('anular: verifica existencia antes de anular', async () => {
    await buildService().anular(CONTEXT, 'r1');
    expect(retencionCompraRepository.anular).toHaveBeenCalledWith(CONTEXT, 'r1');
  });
});
